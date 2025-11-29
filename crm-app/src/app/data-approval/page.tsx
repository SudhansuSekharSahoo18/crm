'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBillEndpoint } from '@/config/api';
import { useApp, hasRole, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill } from '@/types';

export default function DataApproval() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  if (!user || (!hasRole(user, UserRole.DATA_APPROVER) && !hasRole(user, UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const billsForDataApproval = state.bills.filter(
    bill => bill.status === BillStatus.DATA_ENTRY_COMPLETED
  );

  const handleDecision = async (bill: Bill, decision: 'approve' | 'reject', reason?: string) => {
    try {
      console.log(`${decision === 'approve' ? 'Approving' : 'Rejecting'} bill:`, bill.id, reason || '');
      
      const newStatus = decision === 'approve' ? BillStatus.DATA_APPROVED : BillStatus.DATA_REJECTED;
      const auditEntry = createAuditEntry(
        `Data ${decision === 'approve' ? 'approved' : 'rejected'}`,
        user.username,
        `Data ${decision === 'approve' ? 'approved' : 'rejected'} by ${user.username}${reason ? `: ${reason}` : ''}`,
        bill.status,
        newStatus
      );

      const updatedBill = {
        ...bill,
        status: newStatus,
        auditTrail: [...(bill.auditTrail || []), auditEntry]
      };

      const response = await fetch(getBillEndpoint(bill.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          auditTrail: updatedBill.auditTrail
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`Failed to update bill: ${response.statusText} - ${errorText}`);
      }

      const updatedBillFromAPI = await response.json();
      console.log('Bill updated successfully in backend:', updatedBillFromAPI);

      // Update frontend state
      dispatch({
        type: 'UPDATE_BILL',
        payload: updatedBill
      });

      setSelectedBill(null);
      alert(`Bill ${decision === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error processing bill decision:', error);
      alert(`Failed to ${decision} bill. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const calculateTotal = (bill: Bill) => {
    return bill.dataEntry?.lineItems.reduce((sum, item) => sum + item.total, 0) || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {billsForDataApproval.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No data entries pending approval</h3>
              <p className="mt-2 text-gray-500">All data entries have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bills List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Bills Pending Data Approval ({billsForDataApproval.length})
                </h2>
                <div className="space-y-4">
                  {billsForDataApproval.map((bill) => (
                    <div
                      key={bill.id}
                      onClick={() => setSelectedBill(bill)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedBill?.id === bill.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{bill.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
                          <p className="text-sm font-medium text-green-600 mt-1">
                            ${bill.amount.toLocaleString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Review
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Data entered by: {bill.dataEntry?.enteredBy}</p>
                        <p>Entered: {bill.dataEntry?.enteredAt ? new Date(bill.dataEntry.enteredAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details and Actions */}
              <div>
                {selectedBill ? (
                  <div className="space-y-6">
                    {/* Original Bill Details */}
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
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
                      
                      {/* Quick Actions */}
                      <div className="border-t pt-6 mt-6">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleDecision(selectedBill, 'approve')}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium transition-colors"
                          >
                            ✓ Approve Bill
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for rejection:');
                              if (reason) {
                                handleDecision(selectedBill, 'reject', reason);
                              }
                            }}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium transition-colors"
                          >
                            ✗ Reject Bill
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-medium text-gray-900">Select a Bill</h3>
                    <p className="mt-2 text-gray-500">
                      Click on a bill from the list to review its data entry.
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