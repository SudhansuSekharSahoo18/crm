'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getBillEndpoint } from '@/config/api';
import { useApp, hasRole, getNextStatus, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill } from '@/types';

export default function ApproveBills() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  if (!user || (!hasRole(user, UserRole.APPROVER) && !hasRole(user, UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to approve bills.</p>
          </div>
        </div>
      </div>
    );
  }

  const billsToApprove = state.bills.filter(bill => bill.status === BillStatus.SUBMITTED);

  // Debug: Log bills available for approval
  console.log('📋 Bills for approval debug info:');
  console.log('- Total bills in state:', state.bills.length);
  console.log('- Bills to approve:', billsToApprove.length);
  console.log('- All bill statuses:', state.bills.map(b => ({ id: b.id, title: b.title, status: b.status })));
  console.log('- Looking for status:', BillStatus.SUBMITTED);

  const handleDecision = async (bill: Bill, action: 'approve' | 'reject', reason?: string) => {
    console.log('🔄 Starting bill approval process:', { billId: bill.id, action, reason });
    console.log('📋 Bill structure before update:', { 
      id: bill.id, 
      status: bill.status, 
      auditTrail: bill.auditTrail,
      hasAuditTrail: !!bill.auditTrail,
      auditTrailLength: bill.auditTrail ? bill.auditTrail.length : 'undefined'
    });
    
    try {
      const newStatus = getNextStatus(bill.status, action);
      console.log('📊 Status transition:', { from: bill.status, to: newStatus, action });
      
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      
      // Ensure auditTrail exists, initialize if not
      const existingAuditTrail = bill.auditTrail || [];
      
      const updatedBill: Bill = {
        ...bill,
        status: newStatus,
        auditTrail: [
          ...existingAuditTrail,
          createAuditEntry(
            `Bill ${actionText}`,
            user.id,
            reason || `Bill ${actionText} by ${user.username}`,
            bill.status,
            newStatus
          ),
        ],
      };

      if (action === 'approve') {
        updatedBill.status = BillStatus.DATA_ENTRY_PENDING;
        console.log('✅ Setting approved bill status to DATA_ENTRY_PENDING');
      }

      console.log('📤 Sending bill update to backend:', {
        billId: bill.id,
        newStatus: updatedBill.status,
        apiUrl: getBillEndpoint(bill.id)
      });

      // Make API call to update bill in backend
      const response = await fetch(getBillEndpoint(bill.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBill),
      });

      console.log('📨 Backend response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Failed to update bill: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const updatedBillFromServer = await response.json();
      console.log('✅ Bill updated successfully:', updatedBillFromServer);

      // Update local state with the updated bill
      dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
      setSelectedBill(null);

      console.log('🎉 Bill approval process completed successfully');

    } catch (error) {
      console.error('❌ Error updating bill status:', error);
      // You might want to show an error message to the user here
      alert(`Error updating bill status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {billsToApprove.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No bills pending approval</h3>
              <p className="mt-2 text-gray-500">All submitted bills have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bills List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Pending Bills ({billsToApprove.length})
                </h2>
                <div className="space-y-4">
                  {billsToApprove.map((bill) => (
                    <div
                      key={bill.id}
                      className={`bg-white p-6 rounded-lg shadow-md cursor-pointer border-2 transition-colors ${
                        selectedBill?.id === bill.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedBill(bill)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{bill.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{bill.description}</p>
                          <p className="text-lg font-semibold text-green-600 mt-2">
                            ${bill.amount.toLocaleString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Submitted: {new Date(bill.submittedAt).toLocaleDateString()}</p>
                        <p>File: {bill.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details and Actions */}
              <div>
                {selectedBill ? (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Details</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Title</h3>
                        <p className="text-lg text-gray-900">{selectedBill.title}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="text-gray-900">{selectedBill.description}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                        <p className="text-xl font-semibold text-green-600">
                          ${selectedBill.amount.toLocaleString()}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Submitted Date</h3>
                        <p className="text-gray-900">
                          {new Date(selectedBill.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Document</h3>
                        <p className="text-blue-600 underline cursor-pointer">
                          {selectedBill.fileName}
                        </p>
                      </div>

                      {/* Audit Trail */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Audit Trail</h3>
                        <div className="space-y-2">
                          {selectedBill.auditTrail && selectedBill.auditTrail.length > 0 ? (
                            selectedBill.auditTrail.map((entry) => (
                              <div key={entry.id} className="text-sm">
                                <p className="font-medium">{entry.action}</p>
                                <p className="text-gray-600">{entry.details}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(entry.performedAt).toLocaleString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No audit trail available</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex space-x-4">
                      <button
                        onClick={() => handleDecision(selectedBill, 'approve')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) {
                            handleDecision(selectedBill, 'reject', reason);
                          }
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-medium text-gray-900">Select a Bill</h3>
                    <p className="mt-2 text-gray-500">
                      Click on a bill from the list to view details and take action.
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