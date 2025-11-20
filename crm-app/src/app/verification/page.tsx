'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp, hasRole, createAuditEntry } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Bill } from '@/types';

export default function Verification() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  if (!user || (!hasRole(user, UserRole.VERIFIER) && !hasRole(user, UserRole.ADMIN))) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to verify bills.</p>
          </div>
        </div>
      </div>
    );
  }

  const billsForVerification = state.bills.filter(bill => bill.status === BillStatus.DATA_APPROVED);

  const handleDecision = async (bill: Bill, action: 'approve' | 'reject', reason?: string) => {
    try {
      const newStatus = action === 'approve' ? BillStatus.VERIFICATION_COMPLETED : BillStatus.FINAL_REJECTED;
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      
      const auditEntry = createAuditEntry(
        `Verification ${actionText}`,
        user.username,
        reason || `Bill verification ${actionText} by ${user.username}${reason ? `: ${reason}` : ''}`,
        bill.status,
        newStatus
      );

      const updatedBill: Bill = {
        ...bill,
        status: newStatus,
        auditTrail: [
          ...bill.auditTrail,
          auditEntry,
        ],
      };

      // Make API call to update bill status in backend
      const apiBaseUrl = 'http://localhost:5000';
      console.log('Verification - API Base URL:', apiBaseUrl);
      console.log('Verification - Full API URL:', `${apiBaseUrl}/api/bills/${bill.id}`);
      
      const response = await fetch(`${apiBaseUrl}/api/bills/${bill.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          auditTrail: updatedBill.auditTrail
        }),
      });

      console.log('Verification - Response status:', response.status);
      console.log('Verification - Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Verification - Error response:', errorText);
        throw new Error(`Failed to update bill: ${response.statusText} - ${errorText}`);
      }

      const updatedBillFromAPI = await response.json();
      console.log('Verification - Bill updated successfully in backend:', updatedBillFromAPI);

      dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
      setSelectedBill(null);
      alert(`Bill ${actionText} successfully!`);
    } catch (error) {
      console.error('Error processing verification decision:', error);
      alert(`Failed to ${action} bill. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const calculateTotal = (bill: Bill) => {
    return bill.dataEntry?.lineItems.reduce((sum, item) => sum + item.total, 0) || 0;
  };

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case BillStatus.FINAL_APPROVED:
        return 'bg-green-100 text-green-800';
      case BillStatus.FINAL_REJECTED:
      case BillStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case BillStatus.DATA_APPROVED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Final Verification</h1>

          {billsForVerification.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No bills pending verification</h3>
              <p className="mt-2 text-gray-500">All bills have been processed through the verification stage.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bills List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Bills for Verification ({billsForVerification.length})
                </h2>
                <div className="space-y-4">
                  {billsForVerification.map((bill) => (
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
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">Original:</span> ${bill.amount.toLocaleString()}
                            </p>
                            {bill.dataEntry && (
                              <p className="text-sm">
                                <span className="font-medium">Calculated:</span> ${calculateTotal(bill).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                          Ready for Verification
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Submitted: {new Date(bill.submittedAt).toLocaleDateString()}</p>
                        <p>Vendor: {bill.dataEntry?.vendor || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details and Actions */}
              <div>
                {selectedBill ? (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Final Review</h2>
                    
                    {/* Quick Verification Actions - Always visible */}
                    <div className="bg-blue-50 p-4 rounded-md mb-6">
                      <h3 className="text-lg font-medium text-blue-900 mb-4">Verification Actions</h3>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleDecision(selectedBill, 'approve')}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium transition-colors"
                        >
                          ✓ Verify & Approve
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
                          ✗ Reject Verification
                        </button>
                      </div>
                    </div>
                    
                    {selectedBill.dataEntry ? (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-blue-50 p-4 rounded-md">
                          <h3 className="text-lg font-medium text-blue-900 mb-2">{selectedBill.title}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-700">Vendor:</span>
                              <p className="text-blue-900">{selectedBill.dataEntry.vendor}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-700">Invoice #:</span>
                              <p className="text-blue-900">{selectedBill.dataEntry.invoiceNumber}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-700">Category:</span>
                              <p className="text-blue-900">{selectedBill.dataEntry.category}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-700">Due Date:</span>
                              <p className="text-blue-900">{new Date(selectedBill.dataEntry.dueDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Amount Verification */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Amount Verification</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Original Bill Amount:</span>
                              <span className="font-semibold">${selectedBill.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Calculated Total:</span>
                              <span className="font-semibold">${calculateTotal(selectedBill).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-sm font-medium text-gray-600">Difference:</span>
                              <span className={`font-semibold ${
                                Math.abs(selectedBill.amount - calculateTotal(selectedBill)) < 0.01
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                ${Math.abs(selectedBill.amount - calculateTotal(selectedBill)).toFixed(2)}
                                {Math.abs(selectedBill.amount - calculateTotal(selectedBill)) < 0.01 && ' ✓'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Line Items Summary */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Line Items ({selectedBill.dataEntry.lineItems.length})</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedBill.dataEntry.lineItems.map((item, index) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="truncate">{item.description}</span>
                                <span className="font-medium">${item.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Workflow Progress */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Workflow Progress</h4>
                          <div className="space-y-2">
                            {selectedBill.auditTrail.map((entry, index) => (
                              <div key={entry.id} className="flex items-start space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                                  <p className="text-xs text-gray-500">{new Date(entry.performedAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Document Link */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Original Document</h4>
                          {selectedBill.fileUrl ? (
                            <a
                              href={selectedBill.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              {selectedBill.fileName}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500">{selectedBill.fileName}</span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex space-x-4">
                          <button
                            onClick={() => handleDecision(selectedBill, 'approve')}
                            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 font-medium"
                          >
                            Final Approval
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Please provide a reason for final rejection:');
                              if (reason) {
                                handleDecision(selectedBill, 'reject', reason);
                              }
                            }}
                            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 font-medium"
                          >
                            Final Rejection
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Basic Bill Information */}
                        <div className="bg-yellow-50 p-4 rounded-md">
                          <h3 className="text-lg font-medium text-yellow-900 mb-2">{selectedBill.title}</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-yellow-700">Amount:</span>
                              <p className="text-yellow-900">${selectedBill.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium text-yellow-700">Status:</span>
                              <p className="text-yellow-900">{selectedBill.status.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-yellow-700">Description:</span>
                              <p className="text-yellow-900">{selectedBill.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Document Link */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Original Document</h4>
                          {selectedBill.fileUrl ? (
                            <a
                              href={selectedBill.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                              {selectedBill.fileName}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-500">{selectedBill.fileName}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-lg font-medium text-gray-900">Select a Bill</h3>
                    <p className="mt-2 text-gray-500">
                      Choose a bill from the list to perform final verification.
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