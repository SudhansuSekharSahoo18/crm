'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
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
            <p className="mt-2 text-gray-600">You don't have permission to approve data entries.</p>
          </div>
        </div>
      </div>
    );
  }

  const billsForDataApproval = state.bills.filter(bill => bill.status === BillStatus.DATA_ENTRY_COMPLETED);

  const handleDecision = (bill: Bill, action: 'approve' | 'reject', reason?: string) => {
    const newStatus = action === 'approve' ? BillStatus.DATA_APPROVED : BillStatus.DATA_REJECTED;
    const actionText = action === 'approve' ? 'approved' : 'rejected';
    
    const updatedBill: Bill = {
      ...bill,
      status: newStatus,
      auditTrail: [
        ...bill.auditTrail,
        createAuditEntry(
          `Data Entry ${actionText}`,
          user.id,
          reason || `Data entry ${actionText} by ${user.username}`,
          bill.status,
          newStatus
        ),
      ],
    };

    dispatch({ type: 'UPDATE_BILL', payload: updatedBill });
    setSelectedBill(null);
  };

  const calculateTotal = (bill: Bill) => {
    return bill.dataEntry?.lineItems.reduce((sum, item) => sum + item.total, 0) || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Entry Approval</h1>

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
                  Pending Data Approvals ({billsForDataApproval.length})
                </h2>
                <div className="space-y-4">
                  {billsForDataApproval.map((bill) => (
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
                            Original: ${bill.amount.toLocaleString()}
                          </p>
                          {bill.dataEntry && (
                            <p className="text-lg font-semibold text-blue-600">
                              Calculated: ${calculateTotal(bill).toLocaleString()}
                            </p>
                          )}
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
                {selectedBill && selectedBill.dataEntry ? (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Data Entry</h2>
                    
                    <div className="space-y-6">
                      {/* Bill Information */}
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Bill Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Title:</span>
                            <p>{selectedBill.title}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Original Amount:</span>
                            <p className="text-green-600 font-semibold">${selectedBill.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Data Entry Information */}
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Entered Data</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Vendor:</span>
                            <p>{selectedBill.dataEntry.vendor}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Invoice Number:</span>
                            <p>{selectedBill.dataEntry.invoiceNumber}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Invoice Date:</span>
                            <p>{new Date(selectedBill.dataEntry.invoiceDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Due Date:</span>
                            <p>{new Date(selectedBill.dataEntry.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-500">Category:</span>
                            <p>{selectedBill.dataEntry.category}</p>
                          </div>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="border-b pb-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Line Items</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedBill.dataEntry.lineItems.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">{item.quantity}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                                  <td className="px-3 py-2 text-sm text-gray-900">${item.total.toFixed(2)}</td>
                                </tr>
                              ))}
                              <tr className="bg-gray-50">
                                <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                                  Total:
                                </td>
                                <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                                  ${calculateTotal(selectedBill).toFixed(2)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Amount Comparison */}
                      <div className="bg-yellow-50 p-4 rounded-md">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">Amount Verification</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-yellow-700">Original Bill Amount:</span>
                          <span className="font-semibold text-yellow-900">${selectedBill.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-yellow-700">Calculated Total:</span>
                          <span className="font-semibold text-yellow-900">${calculateTotal(selectedBill).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-yellow-200">
                          <span className="text-sm font-medium text-yellow-700">Difference:</span>
                          <span className={`font-semibold ${
                            Math.abs(selectedBill.amount - calculateTotal(selectedBill)) < 0.01
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            ${Math.abs(selectedBill.amount - calculateTotal(selectedBill)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Audit Trail */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Audit Trail</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedBill.auditTrail.map((entry) => (
                            <div key={entry.id} className="text-sm">
                              <p className="font-medium">{entry.action}</p>
                              <p className="text-gray-600">{entry.details}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(entry.performedAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex space-x-4">
                      <button
                        onClick={() => handleDecision(selectedBill, 'approve')}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
                      >
                        Approve Data
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
                        Reject Data
                      </button>
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