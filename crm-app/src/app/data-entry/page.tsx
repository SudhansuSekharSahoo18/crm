'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp, hasRole, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill } from '@/types';

export default function DataEntry() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

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
  const handleBillSelect = (bill: Bill) => {
    setSelectedBill(bill);
  };

  const handleSubmitForDataApproval = async (bill: Bill) => {
    if (!user) return;

    try {
      console.log('📤 Submitting bill for data approval:', bill.id);
      
      const updatedBill: Bill = {
        ...bill,
        status: BillStatus.DATA_ENTRY_COMPLETED,
        auditTrail: [
          ...(bill.auditTrail || []),
          createAuditEntry(
            'Submitted for data approval',
            user.id,
            `Bill submitted for data approval by ${user.username}`,
            bill.status,
            BillStatus.DATA_ENTRY_COMPLETED
          ),
        ],
      };

      // Send the bill update to the backend
      const response = await fetch(`http://localhost:5000/api/bills/${bill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: BillStatus.DATA_ENTRY_COMPLETED,
          auditTrail: updatedBill.auditTrail,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedBillFromServer = await response.json();
      console.log('✅ Bill submitted for data approval successfully:', updatedBillFromServer);

      // Update local state
      dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
      
      // Refresh bills from backend
      await refreshBills();
      
      // Clear selection
      setSelectedBill(null);

    } catch (error) {
      console.error('❌ Error submitting bill for data approval:', error);
      alert(`Error submitting bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
                      
                      {/* Action Button */}
                      <div className="border-t pt-6">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSubmitForDataApproval(selectedBill)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Submit for Data Approval
                          </button>
                        </div>
                      </div>
                    </div>

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