'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/config/api';
import { useApp, hasRole, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill, BillItem } from '@/types';

export default function SubmitBill() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();

  const [formData, setFormData] = useState({
    firm: '',
    description: '',
    file: null as File | null,
    transportFile: null as File | null,
    gstNumber: '', // Add GST number field
    items: [{ itemName: '', formula: '', mrp: '' }] as Array<{ itemName: string; formula: string; mrp: string }>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingGST, setIsExtractingGST] = useState(false);
  const [extractedGSTPreview, setExtractedGSTPreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user || (!hasRole(user, UserRole.SUBMITTER) && !hasRole(user, UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to submit bills.</p>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firm.trim()) {
      newErrors.firm = 'Please select a firm';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.file) {
      newErrors.file = 'Bill document is required';
    }



    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.itemName.trim()) {
        newErrors[`item_${index}_itemName`] = 'Item name is required';
      }
      if (!item.formula.trim()) {
        newErrors[`item_${index}_formula`] = 'Formula is required';
      }
      if (!item.mrp || parseFloat(item.mrp) <= 0) {
        newErrors[`item_${index}_mrp`] = 'Valid MRP is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (file: File | null, field: 'file' | 'transportFile') => {
    if (!file) return;

    setFormData(prev => ({ ...prev, [field]: file }));

    // If it's the main bill file and it's an image, extract GST number using OCR
    if (field === 'file' && file.type.startsWith('image/')) {
      setIsExtractingGST(true);
      try {
        console.log('🔍 Starting GST number extraction for uploaded file...');
        
        const formDataUpload = new FormData();
        formDataUpload.append('billFile', file);

        const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD_MULTIPLE, {
          method: 'POST',
          body: formDataUpload,
        });

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          if (result.gstNumber && result.gstNumber.length > 0) {
            console.log('✅ GST number extraction successful:', result.gstNumber);
            setExtractedGSTPreview(result.gstNumber);
            setFormData(prev => ({
              ...prev,
              gstNumber: result.gstNumber
            }));
          } else {
            console.log('📝 No GST number found in image');
            setExtractedGSTPreview('No GST number could be found in this image');
          }
        }
      } catch (error) {
        console.error('❌ GST extraction failed:', error);
        setExtractedGSTPreview('GST number extraction failed');
      } finally {
        setIsExtractingGST(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to backend first
      const formDataUpload = new FormData();
      formDataUpload.append('billFile', formData.file!);
      if (formData.transportFile) {
        formDataUpload.append('transportFile', formData.transportFile);
      }

      const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD_MULTIPLE, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', uploadResult);
      
      // Use the description entered by user (GST number is handled separately)
      const billDescription = formData.description.trim();
      console.log('📝 Using manual description for bill');
      
      // Find the selected firm to get its ID
      const selectedFirm = state.firms.find(f => f.name === formData.firm);
      
      // Calculate total amount from items
      const totalAmount = formData.items.reduce((sum, item) => sum + parseFloat(item.mrp || '0'), 0);
      
      // Create items array with IDs
      const billItems = formData.items.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        itemName: item.itemName.trim(),
        formula: item.formula.trim(),
        mrp: item.mrp.trim(),
      }));
      
      const newBill: Bill = {
        id: Math.random().toString(36).substr(2, 9),
        title: `Bill-${Date.now()}`,
        description: billDescription, // Use OCR extracted text or manual description
        firmId: selectedFirm?.id,
        amount: totalAmount,
        fileName: uploadResult.files.billFile.fileName,
        fileUrl: uploadResult.files.billFile.fileUrl,
        transportFileName: uploadResult.files.transportFile?.fileName,
        transportFileUrl: uploadResult.files.transportFile?.fileUrl,
        status: BillStatus.SUBMITTED,
        submittedBy: user.id,
        submittedAt: new Date(),
        items: billItems,
        auditTrail: [
          createAuditEntry(
            'Bill Submitted',
            user.id,
            `Bill for ${formData.firm} submitted for approval with ${billItems.length} items`,
            undefined,
            BillStatus.SUBMITTED
          ),
        ],
      };

      // Save to backend API
      console.log('Submitting bill with items:', newBill);
      try {
        const response = await fetch(API_ENDPOINTS.BILLS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newBill),
        });

        console.log('Backend response status:', response.status);
        if (response.ok) {
          const savedBill = await response.json();
          console.log('Bill saved to database:', savedBill);
          
          // Add to local state
          dispatch({ type: 'ADD_BILL', payload: newBill });
          
          alert(`Bill submitted successfully with ${billItems.length} items!`);
        } else {
          const errorText = await response.text();
          console.error('Failed to save bill to database:', errorText);
          // Still add to local state as fallback
          dispatch({ type: 'ADD_BILL', payload: newBill });
          alert('Bill submitted successfully (saved locally)!');
        }
      } catch (apiError) {
        console.error('Error saving bill to database:', apiError);
        // Still add to local state as fallback
        dispatch({ type: 'ADD_BILL', payload: newBill });
        alert('Bill submitted successfully (saved locally)!');
      }

      // Reset form
      setFormData({
        firm: '',
        description: '',
        file: null,
        transportFile: null,
        gstNumber: '',
        items: [{ itemName: '', formula: '', mrp: '' }],
      });
    } catch (error) {
      alert('Error submitting bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileUpload(file, 'file');
  };

  const handleTransportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileUpload(file, 'transportFile');
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', formula: '', mrp: '' }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Firm Selection - At the top */}
              <div>
                <label htmlFor="firm" className="block text-sm font-medium text-gray-700">
                  Select Firm <span className="text-red-500">*</span>
                </label>
                <select
                  id="firm"
                  value={formData.firm}
                  onChange={(e) => setFormData(prev => ({ ...prev, firm: e.target.value }))}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 px-3 py-2 ${
                    errors.firm ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">-- Select a Firm --</option>
                  {state.firms.map((firm) => (
                    <option key={firm.id} value={firm.name}>
                      {firm.name}
                    </option>
                  ))}
                </select>
                {errors.firm && <p className="mt-1 text-sm text-red-600">{errors.firm}</p>}
              </div>

              {/* Upload Bill Document - Moved to top */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  Upload Bill Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                    errors.file ? 'border-red-300' : ''
                  }`}
                />
                {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                </p>
              </div>

              {/* Upload Transport Bill Document */}
              <div>
                <label htmlFor="transportFile" className="block text-sm font-medium text-gray-700">
                  Upload Transport Bill Document <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="file"
                  id="transportFile"
                  onChange={handleTransportFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                    errors.transportFile ? 'border-red-300' : ''
                  }`}
                />
                {errors.transportFile && <p className="mt-1 text-sm text-red-600">{errors.transportFile}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                </p>
              </div>

              {/* GST Extraction Status Indicator */}
              {(isExtractingGST || extractedGSTPreview) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {isExtractingGST ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="text-blue-700 text-sm font-medium">Extracting GST number from uploaded image...</span>
                    </div>
                  ) : extractedGSTPreview && (
                    <div>
                      <div className="flex items-center mb-2">
                        {extractedGSTPreview.length === 15 && extractedGSTPreview.match(/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z0-9]\d$/) ? (
                          <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${extractedGSTPreview.length === 15 ? 'text-green-700' : 'text-yellow-700'}`}>
                          {extractedGSTPreview.length === 15 ? 'GST number extracted successfully!' : 'GST extraction result'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 bg-white p-2 rounded border font-mono">
                        {extractedGSTPreview}
                      </div>
                      {extractedGSTPreview.length === 15 ? (
                        <p className="text-xs text-green-600 mt-1">
                          Valid GST number format detected and auto-filled below.
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-600 mt-1">
                          {extractedGSTPreview.includes('No GST') || extractedGSTPreview.includes('failed') 
                            ? 'You can manually enter the GST number below.' 
                            : 'Please verify the GST number format.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* GST Number Field */}
              <div>
                <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                  GST Number {extractedGSTPreview && extractedGSTPreview.length === 15 && <span className="text-green-600 text-xs">(Auto-filled from image)</span>}
                </label>
                <input
                  type="text"
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 px-3 py-2 font-mono ${
                    errors.gstNumber ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter GST number (e.g., 22AAAAA0000A1Z5)"
                  maxLength={15}
                />
                {errors.gstNumber && <p className="mt-1 text-sm text-red-600">{errors.gstNumber}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  15-character GST number from the bill document
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 px-3 py-2 ${
                    errors.description ? 'border-red-300' : ''
                  }`}
                  placeholder="Enter bill description"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Items Table */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Add Item
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                          Item Name
                        </th>
                        <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                          Formula
                        </th>
                        <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                          MRP (₹)
                        </th>
                        <th className="px-4 py-2 border border-gray-300 text-left text-sm font-medium text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 border border-gray-300">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                              className={`w-full rounded border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm ${
                                errors[`item_${index}_itemName`] ? 'border-red-300' : ''
                              }`}
                              placeholder="Enter item name"
                            />
                            {errors[`item_${index}_itemName`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`item_${index}_itemName`]}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <input
                              type="text"
                              value={item.formula}
                              onChange={(e) => handleItemChange(index, 'formula', e.target.value)}
                              className={`w-full rounded border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm ${
                                errors[`item_${index}_formula`] ? 'border-red-300' : ''
                              }`}
                              placeholder="Enter formula"
                            />
                            {errors[`item_${index}_formula`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`item_${index}_formula`]}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <input
                              type="number"
                              step="0.01"
                              value={item.mrp}
                              onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                              className={`w-full rounded border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm ${
                                errors[`item_${index}_mrp`] ? 'border-red-300' : ''
                              }`}
                              placeholder="0.00"
                            />
                            {errors[`item_${index}_mrp`] && (
                              <p className="text-xs text-red-600 mt-1">{errors[`item_${index}_mrp`]}</p>
                            )}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ 
                      firm: '',
                      description: '', 
                      file: null, 
                      transportFile: null,
                      gstNumber: '',
                      items: [{ itemName: '', formula: '', mrp: '' }] 
                    });
                    setErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}