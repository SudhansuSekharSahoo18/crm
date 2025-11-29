'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_ENDPOINTS, getUserEndpoint } from '@/config/api';
import { useApp, hasRole } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, User } from '@/types';

export default function UserManagement() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roles: [] as UserRole[],
  });

  // Load users from API when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.USERS, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user?.id}`,
          },
        });

        if (response.ok) {
          const users = await response.json();
          // Transform backend users to frontend format
          const transformedUsers: User[] = users.map((dbUser: any) => ({
            id: dbUser.id.toString(),
            username: dbUser.name || dbUser.username || dbUser.email,
            email: dbUser.email,
            roles: Array.isArray(dbUser.roles) ? dbUser.roles.map((r: string) => r as UserRole) : [dbUser.role as UserRole || UserRole.SUBMITTER],
            createdAt: new Date(dbUser.createdAt || new Date()),
            createdBy: 'system',
          }));
          dispatch({ type: 'LOAD_INITIAL_DATA', payload: { users: transformedUsers, bills: state.bills, firms: state.firms } });
        } else {
          console.log('Failed to load users:', response.statusText);
          // Continue with empty users list if fetch fails
        }
      } catch (error) {
        console.error('Error loading users:', error);
        // Continue with empty users list if fetch fails
      } finally {
        setLoading(false);
      }
    };

    if (user && hasRole(user, UserRole.ADMIN)) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user, dispatch, state.bills, state.firms]);

  if (!user || !hasRole(user, UserRole.ADMIN)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-2 text-gray-600">You don't have permission to manage users.</p>
          </div>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      roles: [],
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          name: formData.username, // Backend expects 'name' field
          email: formData.email,
          roles: [...new Set(formData.roles)], // Remove duplicates, roles already uppercase from enum
        };
        
        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch(getUserEndpoint(editingUser.id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`, // Simple auth for now
          },
          body: JSON.stringify(updateData),
        });

        console.log('Update user request:', {
          url: getUserEndpoint(editingUser.id),
          method: 'PUT',
          body: updateData
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Update user error response:', errorText);
          throw new Error(`Failed to update user: ${response.statusText} - ${errorText}`);
        }

        const updatedUser = await response.json();
        dispatch({ type: 'UPDATE_USER', payload: { ...editingUser, ...updateData } });
      } else {
        // Create new user
        const newUserData = {
          name: formData.username, // Backend expects 'name' field
          email: formData.email,
          password: formData.password,
          roles: formData.roles.length > 0 ? formData.roles : [UserRole.SUBMITTER], // Send roles array
        };

        const response = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUserData),
        });

        console.log('Create user response status:', response.status);
        console.log('Create user response URL:', API_ENDPOINTS.AUTH_REGISTER);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Create user error response:', errorText);
          throw new Error(`Failed to create user: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        const newUser: User = {
          id: result.user.id.toString(),
          username: result.user.name || formData.username,
          email: result.user.email,
          roles: Array.isArray(result.user.roles) 
            ? result.user.roles.map((r: string) => r as UserRole) 
            : (result.user.role ? [result.user.role as UserRole] : formData.roles),
          createdAt: new Date(result.user.createdAt || new Date()),
          createdBy: user.id,
        };
        dispatch({ type: 'ADD_USER', payload: newUser });
      }
      
      alert(`User ${editingUser ? 'updated' : 'created'} successfully!`);
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Failed to ${editingUser ? 'update' : 'create'} user. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (userToEdit: User) => {
    console.log('Editing user:', userToEdit);
    console.log('User roles:', userToEdit.roles);
    
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      password: '', // Don't pre-fill password for security
      roles: userToEdit.roles,
    });
    console.log('Form data set with roles:', userToEdit.roles);
    setShowCreateForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(getUserEndpoint(userId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.id}`, // Simple auth for now
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete user: ${response.statusText}`);
        }

        dispatch({ type: 'DELETE_USER', payload: userId });
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Failed to delete user. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role],
    }));
  };

  const getRoleDisplayName = (role: UserRole) => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800',
      [UserRole.SUBMITTER]: 'bg-blue-100 text-blue-800',
      [UserRole.APPROVER]: 'bg-green-100 text-green-800',
      [UserRole.DATA_ENTRY]: 'bg-yellow-100 text-yellow-800',
      [UserRole.DATA_APPROVER]: 'bg-purple-100 text-purple-800',
      [UserRole.VERIFIER]: 'bg-indigo-100 text-indigo-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-end items-center mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              Create New User
            </button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 bg-white"
                      required={!editingUser}
                      placeholder={editingUser ? "Leave blank to keep current password" : ""}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                    <div className="space-y-2">
                      {Object.values(UserRole).map((role) => {
                        const isChecked = formData.roles.includes(role);
                        console.log(`Role ${role} checked:`, isChecked, 'Current roles:', formData.roles);
                        return (
                          <label key={role} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleRoleToggle(role)}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-900">
                              {getRoleDisplayName(role)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {loading ? (
                <li>
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-500">Loading users...</p>
                  </div>
                </li>
              ) : (
                state.users.map((userItem) => (
                <li key={userItem.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {userItem.username}
                          </p>
                          <p className="text-sm text-gray-500">{userItem.email}</p>
                        </div>
                        <div className="ml-4 flex flex-wrap gap-1">
                          {userItem.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                            >
                              {getRoleDisplayName(role)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(userItem)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        {userItem.id !== user.id && (
                          <button
                            onClick={() => handleDelete(userItem.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Created: {new Date(userItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
              )}
              {!loading && state.users.length === 0 && (
                <li>
                  <div className="px-4 py-8 text-center">
                    <p className="text-gray-500">No users found</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Role Descriptions */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Role Descriptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800">Admin</h4>
                <p className="text-sm text-gray-600">Full access to all features and user management</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Submitter</h4>
                <p className="text-sm text-gray-600">Can upload and submit bills for approval</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Approver</h4>
                <p className="text-sm text-gray-600">Can review and approve/reject submitted bills</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Data Entry</h4>
                <p className="text-sm text-gray-600">Can enter data for approved bills</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Data Approver</h4>
                <p className="text-sm text-gray-600">Can approve/reject entered data</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Verifier</h4>
                <p className="text-sm text-gray-600">Can perform final verification and approval</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}