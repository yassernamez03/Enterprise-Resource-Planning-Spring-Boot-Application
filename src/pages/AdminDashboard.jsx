import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../Components/Common/ConfirmDialog';
import LoadingSpinner from '../Components/Common/LoadingSpinner';
import EmptyState from '../Components/Common/EmptyState';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  const navigate = useNavigate();
  
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  // State for password reset dialog
  const [passwordResetState, setPasswordResetState] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    newPassword: '',
  });

  // Load data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'pending') {
          const data = await userService.getPendingApprovals();
          setPendingUsers(data);
        } else if (activeTab === 'all') {
          const data = await userService.getAllUsers();

          setAllUsers(data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user data. Please try again.');
        showErrorToast('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, showErrorToast]);

  // Handle user approval with confirmation
  const handleApproveUser = (userId, userName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve User',
      message: `Are you sure you want to approve ${userName}? They will gain immediate access to the system.`,
      type: 'info',
      onConfirm: async () => {
        try {
          // Show a loading state
          setPendingUsers(pendingUsers.map(user => 
            user.id === userId ? { ...user, isLoading: true } : user
          ));
          
          // Close the dialog
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          await userService.approveUser(userId);
          
          // Update the pending users list
          setPendingUsers(pendingUsers.filter(user => user.id !== userId));
          
          // Show success toast
          showSuccessToast('User has been approved successfully');
        } catch (err) {
          console.error('Error approving user:', err);
          // Remove loading state
          setPendingUsers(pendingUsers.map(user => 
            user.id === userId ? { ...user, isLoading: false } : user
          ));
          
          showErrorToast('Failed to approve user. Please try again.');
        }
      }
    });
  };

  // Handle user rejection with confirmation
  const handleRejectUser = (userId, userName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject User',
      message: `Are you sure you want to reject ${userName}? This will delete their account and they'll need to register again.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          // Show a loading state
          setPendingUsers(pendingUsers.map(user => 
            user.id === userId ? { ...user, isLoading: true } : user
          ));
          
          // Close the dialog
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          await userService.rejectUser(userId);
          
          // Update the pending users list
          setPendingUsers(pendingUsers.filter(user => user.id !== userId));
          
          // Show success toast
          showSuccessToast('User has been rejected');
        } catch (err) {
          console.error('Error rejecting user:', err);
          // Remove loading state
          setPendingUsers(pendingUsers.map(user => 
            user.id === userId ? { ...user, isLoading: false } : user
          ));
          
          showErrorToast('Failed to reject user. Please try again.');
        }
      }
    });
  };

  // Handle password reset flow
  const handleResetPasswordClick = (userId, userName) => {
    setPasswordResetState({
      isOpen: true,
      userId,
      userName,
      newPassword: '',
    });
  };

  const handlePasswordInputChange = (e) => {
    setPasswordResetState({
      ...passwordResetState,
      newPassword: e.target.value
    });
  };

  const handlePasswordResetSubmit = () => {
    // Close the password input dialog
    setPasswordResetState({
      ...passwordResetState,
      isOpen: false
    });
    
    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Password Reset',
      message: `Are you sure you want to reset the password for ${passwordResetState.userName}?`,
      type: 'warning',
      onConfirm: async () => {
        try {
          // Call API to reset password
          await userService.resetUserPassword(
            passwordResetState.userId, 
            passwordResetState.newPassword
          );
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          showSuccessToast('Password has been reset successfully');
          
          // Refresh data
          if (activeTab === 'all') {
            setActiveTab('');
            setTimeout(() => setActiveTab('all'), 10);
          }
        } catch (err) {
          console.error('Error resetting password:', err);
          showErrorToast('Failed to reset password. Please try again.');
        }
      }
    });
  };

  // Function to get status badge color
  const getStatusBadgeColor = (approvalStatus) => {
    // Make sure approvalStatus is a string (if it's a number, convert it)
    const statusVal = String(approvalStatus).toUpperCase();
    
    // Match both numeric and string values
    switch (statusVal) {
      case 'APPROVED':
      case '1':
        return 'bg-green-100 text-green-800'; // Green for approved
      
      case 'PENDING':
      case '0':
        return 'bg-gray-100 text-gray-800'; // Gray for pending
      
      case 'REJECTED':
      case '-1':
        return 'bg-red-100 text-red-800'; // Red for rejected
      
      case 'INACTIVE':
      case 'SUSPENDED':
      case '2':
        return 'bg-yellow-100 text-yellow-800'; // Yellow for other statuses
      
      default:
        return 'bg-gray-100 text-gray-800'; // Default to gray
    }
  };
  
  // Function to get readable status text
  const getStatusText = (approvalStatus) => {
    const statusVal = String(approvalStatus).toUpperCase();
    
    switch (statusVal) {
      case 'APPROVED':
      case '1':
        return 'Approved';
      
      case 'PENDING':
      case '0':
        return 'Pending';
      
      case 'REJECTED':
      case '-1':
        return 'Rejected';
      
      case 'INACTIVE':
      case 'SUSPENDED':
      case '2':
        return 'Inactive';
      
      default:
        // If it's a number or unknown value, return a more readable form
        return isNaN(approvalStatus) ? approvalStatus : `Status: ${approvalStatus}`;
    }
  };

  // If the user is not an admin, show an access denied message
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center text-4xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center mb-6">You don't have permission to access this page.</p>
          <Link to="/" className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simplified header with back button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button 
              onClick={() => navigate('/')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">Manage users and system settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`${
                  activeTab === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending Approvals
                {pendingUsers.length > 0 && (
                  <span className="ml-2 py-0.5 px-2 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`${
                  activeTab === 'all'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Users
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" text="Loading users..." />
          </div>
        )}

        {/* Pending Approvals Table */}
        {!loading && activeTab === 'pending' && (
          <>
            {pendingUsers.length === 0 ? (
              <EmptyState 
                icon={
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                title="No pending approvals"
                message="All user registrations have been processed."
              />
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered On
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">{user.fullName.charAt(0)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleApproveUser(user.id, user.fullName)}
                            className="text-green-600 hover:text-green-900 mr-4 disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={user.isLoading}
                          >
                            {user.isLoading ? (
                              <span className="flex items-center">
                                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-green-600 rounded-full mr-1"></div>
                                Processing...
                              </span>
                            ) : (
                              'Approve'
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id, user.fullName)}
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={user.isLoading}
                          >
                            {user.isLoading ? (
                              <span className="flex items-center">
                                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-red-600 rounded-full mr-1"></div>
                                Processing...
                              </span>
                            ) : (
                              'Reject'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* All Users Table - With Responsive Design */}
        {!loading && activeTab === 'all' && (
          <>
            {allUsers.length === 0 ? (
              <EmptyState 
                icon={
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                title="No users found"
                message="There are no users in the system yet."
              />
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-800 font-medium">{user.fullName.charAt(0)}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                <div className="text-sm text-gray-500 sm:hidden">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(user.approvalStatus)}`}>
                              {getStatusText(user.approvalStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-end sm:items-center justify-end">
                              <button 
                                onClick={() => {
                                  // Change role logic
                                  const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Change User Role',
                                    message: `Are you sure you want to change ${user.fullName}'s role to ${newRole}?`,
                                    type: 'warning',
                                    onConfirm: async () => {
                                      try {
                                        await userService.changeUserRole(user.id, newRole);
                                        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                        showSuccessToast(`User role changed to ${newRole}`);
                                        // Refresh data
                                        setActiveTab('');
                                        setTimeout(() => setActiveTab('all'), 10);
                                      } catch (err) {
                                        showErrorToast('Failed to change user role');
                                      }
                                    }
                                  });
                                }}
                                className="px-2 py-1 w-full sm:w-auto text-center bg-indigo-100 text-indigo-800 rounded text-xs font-medium hover:bg-indigo-200 transition-colors"
                              >
                                Change Role
                              </button>
                              <button 
                                onClick={() => handleResetPasswordClick(user.id, user.fullName)}
                                className="px-2 py-1 w-full sm:w-auto text-center bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                              >
                                Reset Password
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Password Reset Dialog - Made Responsive */}
      {passwordResetState.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password for {passwordResetState.userName}</h3>
            <div className="mb-6">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordResetState.newPassword}
                onChange={handlePasswordInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new password"
                autoFocus
              />
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-end">
              <button
                onClick={() => setPasswordResetState({ ...passwordResetState, isOpen: false })}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordResetSubmit}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300 disabled:cursor-not-allowed"
                disabled={!passwordResetState.newPassword}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default AdminDashboard;