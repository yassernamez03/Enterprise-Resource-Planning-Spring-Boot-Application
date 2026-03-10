import React, { useState } from 'react';
import userService from '../services/userService';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './Common/ConfirmDialog';

/**
 * Component for user management actions available to administrators
 */
const AdminUserActions = ({ userId, currentRole, onActionComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccessToast, showErrorToast } = useToast();
  
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'danger'
  });

  // Available roles for changing user role
  const roles = ['USER', 'ADMIN'];

  // Function to change user role with confirmation
  const handleRoleChange = (newRole) => {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role to ${newRole}?`,
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        setError(null);
        
        try {
          await userService.changeUserRole(userId, newRole);
          
          // Close dropdown and notify parent component
          setIsOpen(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          showSuccessToast(`User role changed to ${newRole} successfully`);
          
          if (onActionComplete) {
            onActionComplete('role_changed');
          }
        } catch (err) {
          setError('Failed to change user role.');
          showErrorToast('Failed to change user role.');
          console.error('Error changing role:', err);
        } finally {
          setLoading(false);
        }
      }
    });
  };
  
  // Function to handle password reset with confirmation
  const handleResetPassword = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset User Password',
      message: 'Are you sure you want to reset this user\'s password? They will receive an email with a new temporary password.',
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        setError(null);
        
        try {
          // Call the API endpoint to reset the user's password
          await userService.resetUserPassword(user.id);
          
          // Close dropdown
          setIsOpen(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          
          showSuccessToast('Password reset email sent to the user');
          
          if (onActionComplete) {
            onActionComplete('password_reset');
          }
        } catch (err) {
          setError('Failed to reset password.');
          showErrorToast('Failed to reset password.');
          console.error('Error resetting password:', err);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
        disabled={loading}
      >
        {loading ? (
          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
        ) : (
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        )}
      </button>

      {error && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 text-red-600 text-xs p-2">
          {error}
        </div>
      )}

      {isOpen && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <div className="px-4 py-2 text-xs text-gray-500 border-b">User actions</div>
          
          {/* Role changing options */}
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                role === currentRole ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              {role === currentRole ? `✓ ${role}` : role}
            </button>
          ))}

          {/* Reset password option */}
          <button
            onClick={handleResetPassword}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t"
          >
            Reset password
          </button>
        </div>
      )}
      
      {/* Render confirmation dialog */}
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

export default AdminUserActions;