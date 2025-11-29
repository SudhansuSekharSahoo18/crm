'use client';

import { useAuth } from '@/context/AuthContext';
import { useApp, hasRole } from '@/context/AppContext';
import { API_ENDPOINTS, getBillEndpoint } from '@/config/api';
import Navigation from '@/components/Navigation';
import { UserRole, BillStatus, Firm } from '@/types';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [firmForm, setFirmForm] = useState({ name: '', gstNumber: '' });
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingFirms, setIsLoadingFirms] = useState(false);
  const [firmsLoadError, setFirmsLoadError] = useState<string | null>(null);
  const [billFilter, setBillFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const billsPerPage = 10;
  const [columnFilters, setColumnFilters] = useState({
    title: '',
    firm: '',
    status: [] as string[],
    submittedBy: ''
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  // Debug: Log current state
  useEffect(() => {
    console.log('Dashboard Debug Info:');
    console.log('- User authenticated:', !!user);
    console.log('- User details:', user);
    console.log('- Current firms in state:', state.firms);
    console.log('- Number of firms in state:', state.firms.length);
    console.log('- Is loading firms:', isLoadingFirms);
    console.log('- Firms load error:', firmsLoadError);
  }, [state.firms, user, isLoadingFirms, firmsLoadError]);

  // Load firms from backend when component mounts
  useEffect(() => {
    const loadFirms = async () => {
      try {
        setIsLoadingFirms(true);
        setFirmsLoadError(null);
        console.log('Starting to fetch firms from backend...');
        
        const response = await fetch(API_ENDPOINTS.FIRMS);
        console.log('Fetch response status:', response.status, response.statusText);

        if (response.ok) {
          const firms = await response.json();
          console.log('Loaded firms from backend:', firms);
          console.log('Number of firms loaded:', firms.length);
          
          const formattedFirms: Firm[] = firms.map((firm: any) => ({
            id: firm._id || firm.id || Math.random().toString(36).substr(2, 9),
            name: firm.name,
            gstNumber: firm.gstNumber,
            createdAt: new Date(firm.createdAt || Date.now()),
            createdBy: firm.createdBy,
          }));
          
          console.log('Formatted firms:', formattedFirms);
          
          // Use specific LOAD_FIRMS action to set only firms data
          dispatch({ 
            type: 'LOAD_FIRMS', 
            payload: formattedFirms 
          });
          
          console.log('Dispatched LOAD_FIRMS with', formattedFirms.length, 'firms');
        } else {
          const errorMsg = `Failed to fetch firms: ${response.status} ${response.statusText}`;
          console.error(errorMsg);
          setFirmsLoadError(errorMsg);
        }
      } catch (error) {
        const errorMsg = `Error loading firms: ${error}`;
        console.error(errorMsg);
        setFirmsLoadError(errorMsg);
      } finally {
        setIsLoadingFirms(false);
      }
    };

    const loadBills = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.BILLS);

        if (response.ok) {
          const bills = await response.json();
          console.log('Loaded bills from backend:', bills);
          
          const formattedBills = bills.map((bill: any) => ({
            ...bill,
            submittedAt: new Date(bill.submittedAt),
            auditTrail: bill.auditTrail || [],
          }));
          
          // Use LOAD_INITIAL_DATA to replace bills while keeping other data
          dispatch({ 
            type: 'LOAD_INITIAL_DATA', 
            payload: { 
              users: state.users, 
              bills: formattedBills, 
              firms: state.firms 
            } 
          });
        }
      } catch (error) {
        console.error('Error loading bills:', error);
      }
    };

    // Load firms for all authenticated users (not just admins)
    if (user) {
      loadFirms();
      loadBills();
    }
  }, [user]);  // Remove dispatch from dependencies to avoid unnecessary re-renders

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [billFilter, columnFilters]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.status-dropdown-container')) {
          setShowStatusDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  // Early return check after all hooks
  if (!user) {
    return <div>Loading...</div>;
  }

  const bills = state.bills;

  // Filter bills based on selected time period
  const getFilteredBills = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let filtered = bills;

    // Time-based filter
    switch (billFilter) {
      case 'today':
        filtered = bills.filter(bill => {
          const billDate = new Date(bill.submittedAt);
          return billDate >= today;
        });
        break;
      case 'week':
        filtered = bills.filter(bill => {
          const billDate = new Date(bill.submittedAt);
          return billDate >= weekAgo;
        });
        break;
      case 'month':
        filtered = bills.filter(bill => {
          const billDate = new Date(bill.submittedAt);
          return billDate >= monthAgo;
        });
        break;
    }

    // Column-based filters
    if (columnFilters.title) {
      filtered = filtered.filter(bill => 
        bill.title.toLowerCase().includes(columnFilters.title.toLowerCase())
      );
    }

    if (columnFilters.firm) {
      filtered = filtered.filter(bill => {
        const firm = state.firms.find(f => f.id === bill.firmId);
        const firmName = firm?.name || '-';
        return firmName.toLowerCase().includes(columnFilters.firm.toLowerCase());
      });
    }

    if (columnFilters.status.length > 0) {
      filtered = filtered.filter(bill => 
        columnFilters.status.includes(bill.status)
      );
    }

    if (columnFilters.submittedBy) {
      filtered = filtered.filter(bill => {
        const submitter = state.users.find(u => u.id === bill.submittedBy);
        const submitterName = submitter?.username || submitter?.email || '';
        return submitterName.toLowerCase().includes(columnFilters.submittedBy.toLowerCase());
      });
    }

    return filtered;
  };

  const filteredBills = getFilteredBills();

  // Pagination logic
  const totalPages = Math.ceil(filteredBills.length / billsPerPage);
  const startIndex = (currentPage - 1) * billsPerPage;
  const endIndex = startIndex + billsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  // Get counts for different bill statuses that the user can access
  const getCounts = () => {
    if (hasRole(user, UserRole.ADMIN)) {
      return {
        total: bills.length,
        submitted: bills.filter(b => b.status === BillStatus.SUBMITTED).length,
        approved: bills.filter(b => b.status === BillStatus.APPROVED).length,
        dataEntryPending: bills.filter(b => b.status === BillStatus.DATA_ENTRY_PENDING).length,
        dataEntryCompleted: bills.filter(b => b.status === BillStatus.DATA_ENTRY_COMPLETED).length,
        dataApproved: bills.filter(b => b.status === BillStatus.DATA_APPROVED).length,
        verified: bills.filter(b => b.status === BillStatus.VERIFIED).length,
        finalApproved: bills.filter(b => b.status === BillStatus.FINAL_APPROVED).length,
      };
    }

    const userBills = bills.filter(bill => 
      bill.submittedBy === user.id || 
      (hasRole(user, UserRole.APPROVER) && bill.status === BillStatus.SUBMITTED) ||
      (hasRole(user, UserRole.DATA_ENTRY) && [BillStatus.APPROVED, BillStatus.DATA_ENTRY_PENDING].includes(bill.status)) ||
      (hasRole(user, UserRole.DATA_APPROVER) && bill.status === BillStatus.DATA_ENTRY_COMPLETED) ||
      (hasRole(user, UserRole.VERIFIER) && bill.status === BillStatus.DATA_APPROVED)
    );

    return {
      total: userBills.length,
      myTasks: userBills.filter(bill => {
        if (hasRole(user, UserRole.APPROVER) && bill.status === BillStatus.SUBMITTED) return true;
        if (hasRole(user, UserRole.DATA_ENTRY) && [BillStatus.APPROVED, BillStatus.DATA_ENTRY_PENDING].includes(bill.status)) return true;
        if (hasRole(user, UserRole.DATA_APPROVER) && bill.status === BillStatus.DATA_ENTRY_COMPLETED) return true;
        if (hasRole(user, UserRole.VERIFIER) && bill.status === BillStatus.DATA_APPROVED) return true;
        return false;
      }).length,
    };
  };

  const counts = getCounts();

  // Firm Management Functions
  const validateFirmForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firmForm.name.trim()) {
      newErrors.name = 'Firm name is required';
    }
    
    if (!firmForm.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(firmForm.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }
    
    // Check if GST number already exists (excluding current editing firm)
    const existingFirm = state.firms.find(f => 
      f.gstNumber === firmForm.gstNumber && 
      (!editingFirm || f.id !== editingFirm.id)
    );
    if (existingFirm) {
      newErrors.gstNumber = 'GST number already exists';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFirmForm()) {
      return;
    }

    try {
      // Check if user is logged in
      if (!user) {
        alert('Please login to add firms');
        return;
      }

      if (editingFirm) {
        // Update existing firm (API call - to be implemented)
        const updatedFirm: Firm = {
          ...editingFirm,
          name: firmForm.name.trim(),
          gstNumber: firmForm.gstNumber.trim(),
        };
        dispatch({ type: 'UPDATE_FIRM', payload: updatedFirm });
      } else {
        // Create new firm via API (no authentication required for testing)
        const response = await fetch(API_ENDPOINTS.FIRMS, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: firmForm.name.trim(),
            gstNumber: firmForm.gstNumber.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create firm');
        }

        const newFirm = await response.json();
        console.log('Firm created successfully:', newFirm);
        
        // Add the new firm to local state
        const firmWithClientId: Firm = {
          id: newFirm._id || newFirm.id || Math.random().toString(36).substr(2, 9),
          name: newFirm.name,
          gstNumber: newFirm.gstNumber,
          createdAt: new Date(newFirm.createdAt || Date.now()),
          createdBy: newFirm.createdBy || user.id,
        };
        
        dispatch({ type: 'ADD_FIRM', payload: firmWithClientId });
        
        // Reload firms from backend to ensure data consistency
        try {
          const firmsResponse = await fetch(API_ENDPOINTS.FIRMS);
          if (firmsResponse.ok) {
            const firms = await firmsResponse.json();
            const formattedFirms: Firm[] = firms.map((firm: any) => ({
              id: firm._id || firm.id || Math.random().toString(36).substr(2, 9),
              name: firm.name,
              gstNumber: firm.gstNumber,
              createdAt: new Date(firm.createdAt || Date.now()),
              createdBy: firm.createdBy,
            }));
            
            dispatch({ 
              type: 'LOAD_INITIAL_DATA', 
              payload: { 
                users: state.users, 
                bills: state.bills, 
                firms: formattedFirms 
              } 
            });
          }
        } catch (reloadError) {
          console.error('Error reloading firms:', reloadError);
        }
        
        alert('Firm added successfully!');
      }

      // Reset form
      setFirmForm({ name: '', gstNumber: '' });
      setEditingFirm(null);
      setErrors({});
    } catch (error: any) {
      console.error('Error saving firm:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditFirm = (firm: Firm) => {
    setEditingFirm(firm);
    setFirmForm({ name: firm.name, gstNumber: firm.gstNumber });
    setErrors({});
  };

  const handleDeleteFirm = (firmId: string) => {
    if (confirm('Are you sure you want to delete this firm?')) {
      dispatch({ type: 'DELETE_FIRM', payload: firmId });
    }
  };

  const resetFirmForm = () => {
    setFirmForm({ name: '', gstNumber: '' });
    setEditingFirm(null);
    setErrors({});
  };

  const tabs = [
    { id: 'overview', name: 'Overview', allowedRoles: [] as UserRole[] },
    { id: 'firms', name: 'Firms', allowedRoles: [UserRole.ADMIN, UserRole.SUBMITTER] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs
                .filter(tab => tab.allowedRoles.length === 0 || tab.allowedRoles.some(role => hasRole(user, role)))
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {hasRole(user, UserRole.ADMIN) ? (
                  <>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{counts.total}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Total Bills</dt>
                              <dd className="text-lg font-medium text-gray-900">{counts.total}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{counts.submitted}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                              <dd className="text-lg font-medium text-gray-900">{counts.submitted}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{counts.dataEntryPending}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Data Entry Pending</dt>
                              <dd className="text-lg font-medium text-gray-900">{counts.dataEntryPending}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{counts.finalApproved}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                              <dd className="text-lg font-medium text-gray-900">{counts.finalApproved}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{counts.total}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">My Bills</dt>
                              <dd className="text-lg font-medium text-gray-900">{counts.total}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{counts.myTasks || 0}</span>
                            </div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
                              <dd className="text-lg font-medium text-gray-900">{counts.myTasks || 0}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Bills</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredBills.length)} of {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} 
                      {billFilter !== 'all' && ` (${billFilter === 'today' ? 'today' : billFilter === 'week' ? 'this week' : 'this month'})`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'today', label: 'Today' },
                      { key: 'week', label: 'This Week' },
                      { key: 'month', label: 'This Month' }
                    ].map((filter) => (
                      <button
                        key={filter.key}
                        onClick={() => setBillFilter(filter.key as 'all' | 'today' | 'week' | 'month')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          billFilter === filter.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col gap-1">
                            <span>Title</span>
                            <input
                              type="text"
                              placeholder="Filter..."
                              value={columnFilters.title}
                              onChange={(e) => setColumnFilters(prev => ({ ...prev, title: e.target.value }))}
                              className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-900 normal-case"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col gap-1">
                            <span>Firm</span>
                            <input
                              type="text"
                              placeholder="Filter..."
                              value={columnFilters.firm}
                              onChange={(e) => setColumnFilters(prev => ({ ...prev, firm: e.target.value }))}
                              className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-900 normal-case"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex flex-col gap-1 relative status-dropdown-container">
                            <span>Status</span>
                            <button
                              type="button"
                              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                              className="mt-1 px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 normal-case text-left flex justify-between items-center hover:bg-gray-50"
                            >
                              <span>{columnFilters.status.length > 0 ? `${columnFilters.status.length} selected` : 'Filter...'}</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showStatusDropdown && (
                              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                                <div className="p-2 space-y-1">
                                  {Object.values(BillStatus).map((status) => (
                                    <label key={status} className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={columnFilters.status.includes(status)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setColumnFilters(prev => ({
                                              ...prev,
                                              status: [...prev.status, status]
                                            }));
                                          } else {
                                            setColumnFilters(prev => ({
                                              ...prev,
                                              status: prev.status.filter(s => s !== status)
                                            }));
                                          }
                                        }}
                                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="text-xs text-gray-700 normal-case">
                                        {status.replace(/_/g, ' ')}
                                      </span>
                                    </label>
                                  ))}
                                  {columnFilters.status.length > 0 && (
                                    <button
                                      onClick={() => setColumnFilters(prev => ({ ...prev, status: [] }))}
                                      className="w-full mt-2 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                      Clear All
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted Date
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedBills.map((bill) => {
                        const submitter = state.users.find(u => u.id === bill.submittedBy);
                        return (
                          <tr 
                            key={bill.id} 
                            onClick={() => router.push(`/bill/${bill.id}`)}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {bill.title}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 truncate">
                                {state.firms.find(f => f.id === bill.firmId)?.name || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                ₹{bill.amount.toLocaleString('en-IN')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                bill.status === BillStatus.FINAL_APPROVED
                                  ? 'bg-green-100 text-green-800'
                                  : bill.status === BillStatus.REJECTED || bill.status === BillStatus.FINAL_REJECTED
                                  ? 'bg-red-100 text-red-800'
                                  : bill.status === BillStatus.VERIFIED || bill.status === BillStatus.DATA_APPROVED
                                  ? 'bg-blue-100 text-blue-800'
                                  : bill.status === BillStatus.DATA_ENTRY_COMPLETED
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {bill.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(bill.submittedAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(bill.submittedAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {(hasRole(user, UserRole.ADMIN) || bill.submittedBy === user.id) && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this bill?')) {
                                      try {
                                        const response = await fetch(getBillEndpoint(bill.id), {
                                          method: 'DELETE',
                                        });
                                        if (response.ok) {
                                          dispatch({ type: 'DELETE_BILL', payload: bill.id });
                                        } else {
                                          alert('Failed to delete bill');
                                        }
                                      } catch (error) {
                                        console.error('Error deleting bill:', error);
                                        alert('Error deleting bill');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                  title="Delete bill"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedBills.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <p className="text-gray-500">
                              {billFilter === 'all' 
                                ? 'No bills found' 
                                : `No bills found for ${billFilter === 'today' ? 'today' : billFilter === 'week' ? 'this week' : 'this month'}`
                              }
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === currentPage
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                <span
                                  key={page}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Firms Tab */}
          {activeTab === 'firms' && (hasRole(user, UserRole.ADMIN) || hasRole(user, UserRole.SUBMITTER)) && (
            <div className="space-y-6">
              {/* Firm Form */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {editingFirm ? 'Edit Firm' : 'Add New Firm'}
                </h2>
                <form onSubmit={handleFirmSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firmName" className="block text-sm font-medium text-gray-700">
                        Firm Name
                      </label>
                      <input
                        type="text"
                        id="firmName"
                        value={firmForm.name}
                        onChange={(e) => setFirmForm(prev => ({ ...prev, name: e.target.value }))}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 px-3 py-2 ${
                          errors.name ? 'border-red-300' : ''
                        }`}
                        placeholder="Enter firm name"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                        GST Number
                      </label>
                      <input
                        type="text"
                        id="gstNumber"
                        value={firmForm.gstNumber}
                        onChange={(e) => setFirmForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-gray-900 px-3 py-2 ${
                          errors.gstNumber ? 'border-red-300' : ''
                        }`}
                        placeholder="27AABCP1234K1Z5"
                        maxLength={15}
                      />
                      {errors.gstNumber && <p className="mt-1 text-sm text-red-600">{errors.gstNumber}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    {editingFirm && (
                      <button
                        type="button"
                        onClick={resetFirmForm}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {editingFirm ? 'Update Firm' : 'Add Firm'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Firms List */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">
                      Firms ({state.firms.length})
                      {isLoadingFirms && <span className="text-blue-500 ml-2">(Loading...)</span>}
                      {firmsLoadError && <span className="text-red-500 ml-2">(Error loading)</span>}
                    </h2>
                    <button
                      onClick={() => {
                        console.log('Manual refresh clicked');
                        if (user) {
                          const loadFirms = async () => {
                            try {
                              setIsLoadingFirms(true);
                              setFirmsLoadError(null);
                              console.log('Manual refresh: Starting to fetch firms from backend...');
                              
                              const response = await fetch(API_ENDPOINTS.FIRMS);
                              console.log('Manual refresh: Fetch response status:', response.status, response.statusText);

                              if (response.ok) {
                                const firms = await response.json();
                                console.log('Manual refresh: Loaded firms from backend:', firms);
                                
                                const formattedFirms: Firm[] = firms.map((firm: any) => ({
                                  id: firm._id || firm.id || Math.random().toString(36).substr(2, 9),
                                  name: firm.name,
                                  gstNumber: firm.gstNumber,
                                  createdAt: new Date(firm.createdAt || Date.now()),
                                  createdBy: firm.createdBy,
                                }));
                                
                                dispatch({ 
                                  type: 'LOAD_FIRMS', 
                                  payload: formattedFirms 
                                });
                              } else {
                                const errorMsg = `Failed to fetch firms: ${response.status} ${response.statusText}`;
                                setFirmsLoadError(errorMsg);
                              }
                            } catch (error) {
                              const errorMsg = `Error loading firms: ${error}`;
                              setFirmsLoadError(errorMsg);
                            } finally {
                              setIsLoadingFirms(false);
                            }
                          };
                          loadFirms();
                        }
                      }}
                      disabled={isLoadingFirms}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoadingFirms ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden">
                  {firmsLoadError && (
                    <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            {firmsLoadError}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Firm Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GST Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {state.firms.map((firm) => (
                        <tr key={firm.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {firm.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {firm.gstNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {firm.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditFirm(firm)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteFirm(firm.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {state.firms.length === 0 && !isLoadingFirms && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            {firmsLoadError ? 'Failed to load firms from backend.' : 'No firms found. Add your first firm above.'}
                          </td>
                        </tr>
                      )}
                      {isLoadingFirms && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-blue-500">
                            Loading firms from backend...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}