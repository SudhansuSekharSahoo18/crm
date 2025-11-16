'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp, hasRole, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill, BillDataEntry, LineItem } from '@/types';

export default function DataEntry() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState({
    vendor: '',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    category: '',
    lineItems: [] as LineItem[],
  });

  // Function to refresh bills from backend
  const refreshBills = async () => {
    try {
      console.log('Refreshing bills from backend...');
      const response = await fetch('http://localhost:5000/api/bills');
      if (response.ok) {
        const bills = await response.json();
        console.log('Refreshed bills:', bills);
        dispatch({ 
          type: 'LOAD_INITIAL_DATA', 
          payload: { 
            users: state.users, 
            bills: bills, 
            firms: state.firms 
          } 
        });
      } else {
        console.error('Failed to refresh bills:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing bills:', error);
    }
  };

  if (!user || (!hasRole(user, UserRole.DATA_ENTRY) && !hasRole(user, UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to enter data.</p>
          </div>
        </div>
      </div>
    );
  }

  const billsForDataEntry = state.bills.filter(bill => 
    bill.status === BillStatus.APPROVED || bill.status === BillStatus.DATA_ENTRY_PENDING
  );

  // Debug: Log bills for data entry
  console.log('Bills for data entry:', billsForDataEntry);
  console.log('All bills in state:', state.bills);
  console.log('Bill statuses:', state.bills.map(b => ({ id: b.id, title: b.title, status: b.status })));

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          id: Math.random().toString(36).substr(2, 9),
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    setFormData(prev => {
      const newLineItems = [...prev.lineItems];
      newLineItems[index] = { ...newLineItems[index], [field]: value };
      
      // Recalculate total for this line item
      if (field === 'quantity' || field === 'unitPrice') {
        newLineItems[index].total = newLineItems[index].quantity * newLineItems[index].unitPrice;
      }
      
      return { ...prev, lineItems: newLineItems };
    });
  };

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const handleBillSelect = (bill: Bill) => {
    setSelectedBill(bill);
    if (bill.dataEntry) {
      setFormData({
        vendor: bill.dataEntry.vendor,
        invoiceNumber: bill.dataEntry.invoiceNumber,
        invoiceDate: bill.dataEntry.invoiceDate.toISOString().split('T')[0],
        dueDate: bill.dataEntry.dueDate.toISOString().split('T')[0],
        category: bill.dataEntry.category,
        lineItems: bill.dataEntry.lineItems,
      });
    } else {
      setFormData({
        vendor: '',
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        category: '',
        lineItems: [],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const dataEntry: BillDataEntry = {
        id: Math.random().toString(36).substr(2, 9),
        billId: selectedBill.id,
        vendor: formData.vendor,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: new Date(formData.invoiceDate),
        dueDate: new Date(formData.dueDate),
        category: formData.category,
        lineItems: formData.lineItems,
        enteredBy: user.id,
        enteredAt: new Date(),
      };

      const updatedBill: Bill = {
        ...selectedBill,
        status: BillStatus.DATA_ENTRY_COMPLETED,
        dataEntry,
        auditTrail: [
          ...selectedBill.auditTrail,
          createAuditEntry(
            'Data Entry Completed',
            user.id,
            `Data entry completed for bill "${selectedBill.title}"`,
            selectedBill.status,
            BillStatus.DATA_ENTRY_COMPLETED
          ),
        ],
      };

      // Make API call to update bill in backend
      console.log('Sending bill update to backend:', updatedBill);
      
      // Send only the necessary fields to avoid issues with complex nested objects
      const updatePayload = {
        status: BillStatus.DATA_ENTRY_COMPLETED,
        dataEntry: {
          id: dataEntry.id,
          billId: dataEntry.billId,
          vendor: dataEntry.vendor,
          invoiceNumber: dataEntry.invoiceNumber,
          invoiceDate: dataEntry.invoiceDate.toISOString(),
          dueDate: dataEntry.dueDate.toISOString(),
          category: dataEntry.category,
          lineItems: dataEntry.lineItems,
          enteredBy: dataEntry.enteredBy,
          enteredAt: dataEntry.enteredAt.toISOString()
        }
      };
      
      console.log('Update payload:', updatePayload);
      
      const response = await fetch(`http://localhost:5000/api/bills/${selectedBill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`Failed to update bill: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const updatedBillFromServer = await response.json();
      console.log('Bill data entry completed successfully:', updatedBillFromServer);

      // Update local state with the updated bill
      dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
      
      // Refresh bills from backend to ensure we have latest data
      await refreshBills();
      
      setSelectedBill(null);
      setFormData({
        vendor: '',
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: '',
        category: '',
        lineItems: [],
      });

    } catch (error) {
      console.error('Error saving data entry:', error);
      // You might want to show an error message to the user here
      alert(`Error saving data entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Entry</h1>

          {billsForDataEntry.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No bills for data entry</h3>
              <p className="mt-2 text-gray-500">All approved bills have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Bills List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Bills for Data Entry ({billsForDataEntry.length})
                </h2>
                <div className="space-y-4">
                  {billsForDataEntry.map((bill) => (
                    <div
                      key={bill.id}
                      className={`bg-white p-4 rounded-lg shadow-md cursor-pointer border-2 transition-colors ${
                        selectedBill?.id === bill.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleBillSelect(bill)}
                    >
                      <h3 className="font-medium text-gray-900">{bill.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">${bill.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                        bill.status === BillStatus.DATA_ENTRY_PENDING
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {bill.status === BillStatus.DATA_ENTRY_PENDING ? 'Pending' : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Entry Form */}
              <div className="lg:col-span-2">
                {selectedBill ? (
                  <div className="space-y-6">
                    {/* Bill Details Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Bill Details: {selectedBill.title}
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md border">
                            {selectedBill.title}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount</label>
                          <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md border">
                            ${selectedBill.amount.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md border">
                            {selectedBill.description}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedBill.status === BillStatus.DATA_ENTRY_PENDING
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {selectedBill.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                          <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md border">
                            {new Date(selectedBill.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Documents Section */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Bill Document */}
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Bill Document</h4>
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium text-gray-700">File Name: </span>
                                <span className="text-sm text-gray-900">{selectedBill.fileName}</span>
                              </div>
                              {selectedBill.fileUrl && (
                                <div>
                                  <a
                                    href={selectedBill.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    📄 View Document
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Transport Bill Document */}
                          {selectedBill.transportFileName && (
                            <div className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Transport Bill Document</h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">File Name: </span>
                                  <span className="text-sm text-gray-900">{selectedBill.transportFileName}</span>
                                </div>
                                {selectedBill.transportFileUrl && (
                                  <div>
                                    <a
                                      href={selectedBill.transportFileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      🚛 View Transport Document
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Data Entry Form */}
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Data Entry Form
                      </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vendor</label>
                        <input
                          type="text"
                          value={formData.vendor}
                          onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                          // required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                        <input
                          type="text"
                          value={formData.invoiceNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                          // required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                        <input
                          type="date"
                          value={formData.invoiceDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                          // required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                          // required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                          // required
                        >
                          <option value="">Select category</option>
                          <option value="Office Supplies">Office Supplies</option>
                          <option value="Travel">Travel</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Software">Software</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
                        <button
                          type="button"
                          onClick={addLineItem}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                        >
                          Add Item
                        </button>
                      </div>

                      {formData.lineItems.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 mb-2">
                          <div className="col-span-5">
                            <input
                              type="text"
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Unit Price"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={`$${item.total.toFixed(2)}`}
                              readOnly
                              className="w-full rounded-md border-gray-300 bg-gray-50 text-sm text-gray-900"
                            />
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="w-full bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}

                      {formData.lineItems.length === 0 && (
                        <p className="text-gray-500 text-sm">No line items added yet.</p>
                      )}
                    </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => setSelectedBill(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                        >
                          Save Data Entry
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-medium text-gray-900">Select a Bill</h3>
                    <p className="mt-2 text-gray-500">
                      Choose a bill from the list to enter its data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}