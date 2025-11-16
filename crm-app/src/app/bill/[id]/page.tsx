'use client';

import { useAuth } from '@/context/AuthContext';
import { useApp, hasRole } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { BillStatus, UserRole } from '@/types';
import { useParams, useRouter } from 'next/navigation';

export default function BillView() {
  const { user } = useAuth();
  const { state } = useApp();
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  if (!user) {
    return <div>Loading...</div>;
  }

  const bill = state.bills.find(b => b.id === billId);

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Bill Not Found</h1>
            <p className="mt-2 text-gray-600">The bill you're looking for doesn't exist.</p>
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

  const getStatusColor = (status: BillStatus) => {
    switch (status) {
      case BillStatus.FINAL_APPROVED:
        return 'bg-green-100 text-green-800';
      case BillStatus.REJECTED:
      case BillStatus.FINAL_REJECTED:
        return 'bg-red-100 text-red-800';
      case BillStatus.VERIFIED:
        return 'bg-blue-100 text-blue-800';
      case BillStatus.DATA_APPROVED:
        return 'bg-purple-100 text-purple-800';
      case BillStatus.DATA_ENTRY_COMPLETED:
        return 'bg-indigo-100 text-indigo-800';
      case BillStatus.DATA_ENTRY_PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BillStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case BillStatus.SUBMITTED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmitterName = (submitterId: string) => {
    const submitter = state.users.find(u => u.id === submitterId);
    return submitter ? submitter.username : 'Unknown User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="mb-2 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{bill.title}</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Edit Button - Only show for submitted or rejected bills and if user is submitter or admin */}
              {(bill.status === BillStatus.SUBMITTED || bill.status === BillStatus.REJECTED) && 
               (bill.submittedBy === user?.id || hasRole(user!, UserRole.ADMIN)) && (
                <button
                  onClick={() => router.push(`/bill/${bill.id}/edit`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Bill
                </button>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill.status)}`}>
                {bill.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={bill.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Bill Document
                  </a>
                  {bill.transportFileName && bill.transportFileUrl && (
                    <a
                      href={bill.transportFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Transport Document
                    </a>
                  )}
                  {bill.items && bill.items.length > 0 && (
                    <button
                      onClick={() => {
                        const itemsSection = document.getElementById('bill-items-section');
                        itemsSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      View Items ({bill.items.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Bill Details */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Bill Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{bill.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">₹{bill.amount.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submitted By</dt>
                    <dd className="mt-1 text-sm text-gray-900">{getSubmitterName(bill.submittedBy)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Submitted Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{new Date(bill.submittedAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">File Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{bill.fileName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {bill.status.replace('_', ' ')}
                      </span>
                    </dd>
                  </div>
                </dl>

                {/* Bill Document */}
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Bill Document</dt>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {/* Document preview thumbnail */}
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">{bill.fileName}</h4>
                          <p className="text-sm text-gray-500">Bill Document</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={bill.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Document
                        </a>
                        <a
                          href={bill.fileUrl}
                          download={bill.fileName}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transport Bill Document */}
                {bill.transportFileName && bill.transportFileUrl && (
                  <div className="mt-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Transport Bill Document</dt>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {/* Transport document preview thumbnail */}
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">{bill.transportFileName}</h4>
                            <p className="text-sm text-gray-500">Transport Bill Document</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={bill.transportFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Transport Document
                          </a>
                          <a
                            href={bill.transportFileUrl}
                            download={bill.transportFileName}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Items Section */}
              {bill.items && bill.items.length > 0 && (
                <div id="bill-items-section" className="bg-white shadow rounded-lg p-6">{/* Added id for scrolling */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Bill Items ({bill.items.length} items)
                    </h2>
                    <div className="text-sm text-gray-500">
                      Total: ₹{bill.items.reduce((sum, item) => sum + parseFloat(item.mrp), 0).toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Items Cards for mobile */}
                  <div className="block md:hidden space-y-4">
                    {bill.items.map((item, index) => (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900">{item.itemName}</h3>
                          <span className="text-lg font-semibold text-green-600">₹{parseFloat(item.mrp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 font-mono bg-white px-2 py-1 rounded border">
                          {item.formula}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Items Table for desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            S.No.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Formula
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            MRP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bill.items.map((item, index) => (
                          <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.itemName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div className="font-mono bg-gray-100 px-2 py-1 rounded text-xs border max-w-xs">
                                {item.formula}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                              ₹{parseFloat(item.mrp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                            <span className="text-lg">Total Bill Amount:</span>
                          </td>
                          <td className="px-6 py-4 text-right text-lg font-bold text-green-600">
                            ₹{bill.items.reduce((sum, item) => sum + parseFloat(item.mrp), 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <dt className="text-sm font-medium text-gray-500">Total Items</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">{bill.items.length}</dd>
                    </div>
                    <div className="text-center">
                      <dt className="text-sm font-medium text-gray-500">Average Item Value</dt>
                      <dd className="mt-1 text-2xl font-semibold text-gray-900">
                        ₹{Math.round(bill.items.reduce((sum, item) => sum + parseFloat(item.mrp), 0) / bill.items.length).toLocaleString()}
                      </dd>
                    </div>
                    <div className="text-center">
                      <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
                      <dd className="mt-1 text-2xl font-semibold text-green-600">
                        ₹{bill.items.reduce((sum, item) => sum + parseFloat(item.mrp), 0).toLocaleString()}
                      </dd>
                    </div>
                  </div>
                </div>
              )}

              {/* No Items Message */}
              {(!bill.items || bill.items.length === 0) && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Items</h3>
                    <p className="mt-1 text-sm text-gray-500">No items have been added to this bill yet.</p>
                  </div>
                </div>
              )}

              {/* Data Entry Line Items (if available) */}
              {bill.dataEntry?.lineItems && bill.dataEntry.lineItems.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Data Entry Line Items ({bill.dataEntry.lineItems.length} items)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bill.dataEntry.lineItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{item.unitPrice.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Audit Trail */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Audit Trail</h2>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {bill.auditTrail.map((entry, index) => (
                      <li key={index}>
                        <div className="relative pb-8">
                          {index !== bill.auditTrail.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900">{entry.action}</span>
                                </div>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  {new Date(entry.performedAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="mt-2 text-sm text-gray-700">
                                <p>{entry.details}</p>
                                {entry.previousStatus && entry.newStatus && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Status: {entry.previousStatus.replace('_', ' ')} → {entry.newStatus.replace('_', ' ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}