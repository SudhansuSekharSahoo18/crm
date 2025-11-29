'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_ENDPOINTS, getBillEndpoint } from '@/config/api';
import { useApp, hasRole, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill } from '@/types';
import { useParams, useRouter } from 'next/navigation';

export default function EditBill() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  const [bill, setBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState({
    firm: '',
    description: '',
    file: null as File | null,
    transportFile: null as File | null,
    items: [{ itemName: '', formula: '', mrp: '' }] as Array<{ itemName: string; formula: string; mrp: string }>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Find the bill to edit
    const foundBill = state.bills.find(b => b.id === billId);
    if (foundBill) {
      setBill(foundBill);
      setFormData({
        firm: '', // We'll need to extract firm from description or add firm field to Bill type
        description: foundBill.description,
        file: null,
        transportFile: null,
        items: [{ itemName: '', formula: '', mrp: foundBill.amount.toString() }], // Basic conversion
      });
    }
  }, [billId, state.bills]);

  if (!user || (!hasRole(user, UserRole.SUBMITTER) && !hasRole(user, UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to edit bills.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Bill Not Found</h1>
            <p className="mt-2 text-gray-600">The bill you're trying to edit doesn't exist.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Only allow editing if bill is in certain statuses
  const canEdit = bill.status === BillStatus.SUBMITTED || bill.status === BillStatus.REJECTED;
  
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-orange-600">Cannot Edit Bill</h1>
            <p className="mt-2 text-gray-600">
              This bill cannot be edited as it has already been processed (Status: {bill.status.replace('_', ' ')}).
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (item.itemName && !item.mrp) {
        newErrors[`item_${index}_mrp`] = 'MRP is required if item name is provided';
      }
      if (item.mrp && parseFloat(item.mrp) <= 0) {
        newErrors[`item_${index}_mrp`] = 'Valid MRP is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let fileUrl = bill.fileUrl;
      let transportFileUrl = bill.transportFileUrl;
      let fileName = bill.fileName;
      let transportFileName = bill.transportFileName;

      // Upload new files if provided
      if (formData.file || formData.transportFile) {
        const formDataUpload = new FormData();
        
        if (formData.file) {
          formDataUpload.append('billFile', formData.file);
        }
        if (formData.transportFile) {
          formDataUpload.append('transportFile', formData.transportFile);
        }

        try {
          const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD_MULTIPLE, {
            method: 'POST',
            body: formDataUpload,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.files.billFile) {
              fileName = uploadResult.files.billFile.fileName;
              fileUrl = uploadResult.files.billFile.fileUrl;
            }
            
            if (uploadResult.files.transportFile) {
              transportFileName = uploadResult.files.transportFile.fileName;
              transportFileUrl = uploadResult.files.transportFile.fileUrl;
            }
          }
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
        }
      }
      
      // Calculate total amount from items
      const totalAmount = formData.items
        .filter(item => item.itemName && item.mrp)
        .reduce((sum, item) => sum + parseFloat(item.mrp || '0'), 0);
      
      const updatedBill: Bill = {
        ...bill,
        description: formData.description.trim(),
        amount: totalAmount,
        fileName,
        fileUrl,
        transportFileName,
        transportFileUrl,
        auditTrail: [
          ...bill.auditTrail,
          createAuditEntry(
            'Bill Updated',
            user.id,
            `Bill details updated by ${user.username}`,
            undefined,
            bill.status
          ),
        ],
      };

      // Save to backend API
      try {
        const response = await fetch(getBillEndpoint(billId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedBill),
        });

        if (response.ok) {
          console.log('Bill updated in database');
          
          // Update local state
          dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
          
          alert('Bill updated successfully!');
          router.push(`/bill/${billId}`);
        } else {
          console.error('Failed to update bill in database');
          alert('Failed to update bill. Please try again.');
        }
      } catch (apiError) {
        console.error('Error updating bill:', apiError);
        alert('Error updating bill. Please try again.');
      }
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Error updating bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const handleTransportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, transportFile: file }));
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
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-2 text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Bill: {bill.title}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Status: <span className="font-medium">{bill.status.replace('_', ' ')}</span>
            </p>
          </div>

          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Files Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Current Files</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Bill Document: {bill.fileName}</p>
                  {bill.transportFileName && (
                    <p>Transport Document: {bill.transportFileName}</p>
                  )}
                  <p className="text-xs text-blue-600">Upload new files below to replace existing ones</p>
                </div>
              </div>

              {/* Upload Bill Document */}
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  Replace Bill Document (Optional)
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to keep current file. Accepted formats: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>

              {/* Upload Transport Bill Document */}
              <div>
                <label htmlFor="transportFile" className="block text-sm font-medium text-gray-700">
                  Replace Transport Bill Document (Optional)
                </label>
                <input
                  type="file"
                  id="transportFile"
                  onChange={handleTransportFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to keep current file. Accepted formats: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
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
                              className="w-full rounded border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm"
                              placeholder="Enter item name"
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <input
                              type="text"
                              value={item.formula}
                              onChange={(e) => handleItemChange(index, 'formula', e.target.value)}
                              className="w-full rounded border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm"
                              placeholder="Enter formula"
                            />
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
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}