import { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, DollarSign, Home, Phone, Briefcase, ChevronDown } from 'lucide-react';
import employeeService from '../../services/employeeService';
import userService from '../../services/userService'; // Make sure to import userService

export default function EditEmployeeModal({ isOpen, onClose, onEmployeeUpdated, employee }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const filteredAvailableUsers = availableUsers.filter(user => 
  user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );
  useEffect(() => {
    if (isOpen && !employee) {
      console.error('EditEmployeeModal opened without an employee object');
      setError('No employee selected for editing');
    } else {
      setError(null);
    }
  }, [isOpen, employee]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: '',
    position: '',
    role: '',
    salary: '',
    userId: null, // Add userId to form state
    address: {
      street: '',
      city: '',
      zipCode: '',
      country: ''
    },
    status: 'ACTIVE'
  });

  // Fetch available users when modal opens
  // In your useEffect that fetches users
useEffect(() => {
  if (isOpen) {
    const fetchData = async () => {
      try {
        // Fetch both users and employees
        const [users, employees] = await Promise.all([
          userService.getAllUsers(),
          employeeService.getAllEmployees()
        ]);
        
        // Get all userIds that are already assigned in employees
        const assignedUserIds = employees
          .map(emp => emp.userId)
          .filter(id => id !== null && id !== undefined);
        
        console.log(assignedUserIds, 'Assigned User IDs');
        
        // Filter users to only include those not assigned (or the current employee's user)
        const available = users.filter(user => 
          !assignedUserIds.includes(user.id) || 
          (employee && employee.userId === user.id)
        );
        
        setAvailableUsers(available);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    
    fetchData();
  }
}, [isOpen, employee]); // Add employee to dependencies

  useEffect(() => {
    if (employee) {
      const formattedDateOfBirth = employee.dateOfBirth ? 
        employee.dateOfBirth.substring(0, 10) : '';
      const formattedHireDate = employee.hireDate ? 
        employee.hireDate.substring(0, 10) : '';
      
      const addressData = employee.address || {
        street: '',
        city: '',
        zipCode: '',
        country: ''
      };
      
      const address = typeof addressData === 'string' ? 
        { street: addressData, city: '', zipCode: '', country: '' } : 
        addressData;
      
      const salary = employee.salary ? Number(employee.salary) : '';
      
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        dateOfBirth: formattedDateOfBirth,
        hireDate: formattedHireDate,
        position: employee.position || '',
        role: employee.role || '',
        salary: salary,
        userId: employee.userId || null, // Initialize userId from employee data
        address: address,
        status: employee.status || 'ACTIVE'
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else if (name === 'salary') {
      const numericValue = value === '' ? '' : Number(value);
      setFormData({
        ...formData,
        [name]: numericValue,
      });
    } else if (name === 'userId') {
      // Convert userId to number (or null if empty)
      setFormData({
        ...formData,
        [name]: value ? parseInt(value, 10) : null
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

// In EditEmployeeModal.js
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setError(null);
  
  try {
    const response = await employeeService.updateEmployee(employee.id, formData);
    const updatedEmployee = response.data || response;
    
    // Call the onEmployeeUpdated callback with success status
    onEmployeeUpdated(updatedEmployee, true);
    onClose();
  } catch (err) {
    console.error('Error updating employee:', err);
    const errorMsg = err.response?.data?.message || err.message || 'Failed to update employee';
    setError(errorMsg);
    
    // Call the onEmployeeUpdated callback with failure status and error message
    onEmployeeUpdated(null, false, errorMsg);
  } finally {
    setIsSubmitting(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <UserPlus size={20} className="text-blue-500" />
            <h3 className="text-lg font-medium text-gray-800">Edit Employee</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {error && (
              <div className="md:col-span-2 mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-md text-sm flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700 flex items-center">
                <UserPlus size={16} className="mr-2 text-blue-500" />
                Personal Information
              </h4>
              
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="John"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Doe"
                />
              </div>
              
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Contact Information Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700 flex items-center">
                <Phone size={16} className="mr-2 text-blue-500" />
                Contact Information
              </h4>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="john.doe@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890"
                  />
                  <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Street
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                  <Home size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New York"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10001"
                  />
                </div>
                
                <div>
                  <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>
            
            {/* Professional Information Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700 flex items-center">
                <Briefcase size={16} className="mr-2 text-blue-500" />
                Professional Information
              </h4>
              
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Frontend Developer"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Select a role</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="Manager">Manager</option>
                  <option value="Analyst">Analyst</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="hireDate"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Add the user assignment field here */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Users
                </label>
                
                {/* Selected users chips */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.userId && availableUsers.find(u => u.id === formData.userId) && (
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                      {availableUsers.find(u => u.id === formData.userId).fullName}
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, userId: null})}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Dropdown with search */}
                <div className="relative">
                  <div 
                    className={`border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center cursor-pointer`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <span className="text-gray-500">
                      {formData.userId ? '1 user selected' : 'Select users'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                  
                  {dropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {/* Search input */}
                      <div className="p-2 sticky top-0 bg-white border-b">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      {/* User list */}
                      <ul>
                        {filteredAvailableUsers.map((user) => (
                          <li 
                            key={user.id}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                              formData.userId === user.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => {
                              setFormData({...formData, userId: user.id});
                              setDropdownOpen(false);
                            }}
                          >
                            {user.fullName}
                          </li>
                        ))}
                        {filteredAvailableUsers.length === 0 && (
                          <li className="px-3 py-2 text-gray-500 text-center">No users found</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Compensation Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700 flex items-center">
                <DollarSign size={16} className="mr-2 text-blue-500" />
                Compensation & Status
              </h4>
              
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Gross Salary
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    min="0"
                    // step="1000"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="PROBATION">Probation</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="border-t px-6 py-4 flex justify-end space-x-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isSubmitting || !employee?.id}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}