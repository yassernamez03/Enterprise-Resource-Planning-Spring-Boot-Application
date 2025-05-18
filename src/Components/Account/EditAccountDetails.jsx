import React, { useState } from 'react';
import { User, Mail, Key, ArrowLeft } from 'lucide-react';
import accountService from '../../services/accountService';
import FileUpload from '../Common/FileUpload';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../Common/LoadingSpinner';

const EditAccountDetails = ({ user, onSave, onCancel }) => {
  const { showSuccessToast, showErrorToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || null);
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Character variety checks
    if (/[0-9]/.test(password)) strength += 1; // Has number
    if (/[a-z]/.test(password)) strength += 1; // Has lowercase
    if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char
    
    return strength;
  };

  // Validate if password meets all requirements
  const isPasswordValid = (password) => {
    if (!password) return false;
    return password.length >= 8 && 
           /[0-9]/.test(password) && 
           /[a-z]/.test(password) && 
           /[A-Z]/.test(password) && 
           /[^A-Za-z0-9]/.test(password);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
      
      // Check if passwords match
      if (formData.confirmPassword) {
        setPasswordsMatch(value === formData.confirmPassword);
      }
    }
    
    if (name === 'confirmPassword') {
      setPasswordsMatch(value === formData.newPassword);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Update profile data (name, email)
      const profileData = {
        fullName: formData.fullName,
        email: formData.email
      };
      
      const updatedUser = await accountService.updateProfile(profileData);
      
      // If there's a new avatar, upload it
      if (avatar) {
        await accountService.uploadAvatar(avatar);
      }
      
      setSuccessMessage('Profile updated successfully!');
      showSuccessToast('Profile updated successfully!');
      
      // Notify parent component of the update
      onSave({
        name: formData.fullName,
        email: formData.email,
        avatar: previewUrl
      });
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      showErrorToast('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      showErrorToast('New passwords do not match.');
      return;
    }

     if (!isPasswordValid(formData.newPassword)) {
      setError('Password must have at least 8 characters, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character');
      showErrorToast('Password does not meet security requirements.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await accountService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );
      
      setSuccessMessage('Password changed successfully!');
      showSuccessToast('Password changed successfully!');
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Reset password strength
      setPasswordStrength(0);
    } catch (err) {
      setError('Failed to change password. Please check your current password.');
      showErrorToast('Failed to change password. Please check your current password.');
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={onCancel}
          className="mr-3 p-2 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-xl font-medium text-slate-800">Edit Account Details</h2>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
          {successMessage}
        </div>
      )}
      
      <div className="border-b pb-6 mb-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Avatar</h3>
        <div className="flex items-center">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Avatar Preview" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User size={24} />
              </div>
            )}
          </div>
          <div className="ml-4">
            <FileUpload
              onFileChange={file => setAvatar(file)}
              accept="image/*"
              maxSizeMB={1}
              label="Upload Avatar"
            />
            <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max size 1MB.</p>
          </div>
        </div>
      </div>
      
      {/* Profile Information Form */}
      <form onSubmit={handleProfileUpdate}>
        <h3 className="text-lg font-medium text-slate-800 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-10 p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your full name"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@company.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </div>
      </form>
      
      {/* Password Change Form */}
      <div className="border-t pt-6 mt-6">
        <form onSubmit={handlePasswordChange}>
          <h3 className="text-lg font-medium text-slate-800 mb-4">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key size={16} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full pl-10 p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Your current password"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="New password"
                disabled={isLoading}
              />
              
              {/* Password strength indicator */}
              {formData.newPassword && (
                <div className="mt-1">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        passwordStrength === 0 ? 'w-0' :
                        passwordStrength === 1 ? 'w-1/5 bg-red-500' :
                        passwordStrength === 2 ? 'w-2/5 bg-orange-500' :
                        passwordStrength === 3 ? 'w-3/5 bg-yellow-500' :
                        passwordStrength === 4 ? 'w-4/5 bg-lime-500' :
                        'w-full bg-green-500'
                      }`}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {passwordStrength === 0 ? 'Enter a password' :
                     passwordStrength === 1 ? 'Very weak' :
                     passwordStrength === 2 ? 'Weak' :
                     passwordStrength === 3 ? 'Medium' :
                     passwordStrength === 4 ? 'Strong' :
                     'Very strong'}
                  </p>
                  {formData.newPassword && !isPasswordValid(formData.newPassword) && (
                    <p className="text-xs text-red-500 mt-1">
                      Password must have at least 8 characters, including 1 uppercase letter, 
                      1 lowercase letter, 1 number, and 1 special character
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-2 border ${!passwordsMatch && formData.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'} rounded focus:outline-none focus:ring-2`}
                placeholder="Confirm new password"
                disabled={isLoading}
              />
              
              {/* Password match indicator */}
              {!passwordsMatch && formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
            
            <div className="pt-4">
              <button 
                type="submit"
                disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || !passwordsMatch || !isPasswordValid(formData.newPassword)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAccountDetails;