'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp, hasRole } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import { UserRole, User } from '@/types';

export default function UserManagement() {
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    roles: [] as UserRole[],
  });

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
      roles: [],
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update existing user
      const updatedUser: User = {
        ...editingUser,
        username: formData.username,
        email: formData.email,
        roles: formData.roles,
      };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } else {
      // Create new user
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: formData.username,
        email: formData.email,
        roles: formData.roles,
        createdAt: new Date(),
        createdBy: user.id,
      };
      dispatch({ type: 'ADD_USER', payload: newUser });
    }
    
    resetForm();
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      roles: userToEdit.roles,
    });
    setShowCreateForm(true);
  };

  const handleDelete = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      dispatch({ type: 'DELETE_USER', payload: userId });
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
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                    <div className="space-y-2">
                      {Object.values(UserRole).map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.roles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-900">
                            {getRoleDisplayName(role)}
                          </span>
                        </label>
                      ))}
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
              {state.users.map((userItem) => (
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
              ))}
              {state.users.length === 0 && (
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