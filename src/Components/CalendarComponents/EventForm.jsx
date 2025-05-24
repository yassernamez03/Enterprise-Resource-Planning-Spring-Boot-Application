import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import calendarService from '../../services/calanderService';
import { useCalendar } from '../../context/CalendarContext';
import userService from '../../services/userService';

const EventForm = ({ event, onClose, onSuccess, currentUser }) => {
  // Form state
  const { refreshEvents } = useCalendar();
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [location, setLocation] = useState(event?.location || '');
  const [startDate, setStartDate] = useState(
    event?.startTime ? 
      new Date(event.startTime).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    event?.startTime ? 
      new Date(event.startTime).toTimeString().slice(0, 5) : 
      '09:00'
  );
  const [endDate, setEndDate] = useState(
    event?.dueDate ? 
      new Date(event.dueDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
  );
  const [endTime, setEndTime] = useState(
    event?.dueDate ? 
      new Date(event.dueDate).toTimeString().slice(0, 5) : 
      '10:00'
  );
  const [type, setType] = useState(event?.type || 'EVENT');
  const [status, setStatus] = useState(event?.status || 'PENDING');
  const [global, setglobal] = useState(event?.global || false);

  // User selection
  const [users, setUsers] = useState([]);
  const [assignedUserIds, setAssignedUserIds] = useState(event?.assignedUsers?.map(user => user.id) || []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derived state
  const isUpdatingTask = event && event.type === 'TASK';
  const isCreatingEvent = type === 'EVENT';

  // Effect to handle type changes
  useEffect(() => {
    if (type === 'EVENT') {
      setStatus('PENDING');
    }
    
    if (type === 'TASK') {
      setLocation('');
    }
  }, [type]);

  // Effect to clear assigned users when global is checked
  useEffect(() => {
    if (global) {
      setAssignedUsers([]);
    }
  }, [global]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        console.log('Users : ', response);
        setUsers(response); 
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };
    
    fetchUsers();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (end <= start) {
      setError('End time must be after start time');
      setLoading(false);
      return;
    }
    
    const eventData = {
      title,
      description,
      type,
      status: type === 'TASK' ? status : 'PENDING',
      startTime: start.toISOString(),
      dueDate: end.toISOString(),
      location: type === 'EVENT' ? location : '',
      global,
      user: { id: currentUser },
      assignedUserIds: global ? [] : assignedUserIds    };

    try {
      if (event && event.id) {
        // Update existing event/task
        const updatedEvent = await calendarService.updateEvent(event.id, eventData);
        console.log('Successfully updated:', updatedEvent);
      } else {
        // Create new event/task
        const createdEvent = await calendarService.createEvent(eventData);
        console.log('Successfully created:', createdEvent);
      }
      await refreshEvents();
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  // Handle event deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setLoading(true);
      try {
        await calendarService.deleteEvent(event.id);
        await refreshEvents();
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
        onClose();
      } catch (err) {
        console.error('Error deleting event:', err);
        setError(err.response?.data?.message || 'Failed to delete event');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle user assignment
  const toggleUser = (user) => {
  if (assignedUserIds.includes(user.id)) {
    setAssignedUserIds(assignedUserIds.filter(id => id !== user.id));
  } else {
    setAssignedUserIds([...assignedUserIds, user.id]);
  }
};

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate status options
  const getStatusOptions = () => {
    return ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  };

  // Check if field should be disabled
  const isFieldDisabled = () => {
    return loading;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {event ? 'Edit ' + (type === 'TASK' ? 'Task' : 'Event') : 'Create ' + (type === 'TASK' ? 'Task' : 'Event')}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={loading}
            >
              <option value="EVENT">Event</option>
              <option value="TASK">Task</option>
            </select>
          </div>
          
          {/* Status Field (only for tasks) */}
          {type === 'TASK' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={loading}
              >
                {getStatusOptions().map(option => (
                  <option key={option} value={option}>
                    {option.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Event title"
              required
              disabled={isFieldDisabled()}
            />
          </div>
          
          {/* Description Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Event description"
              rows="3"
              disabled={isFieldDisabled()}
            />
          </div>

          {/* Location Field (only for events) */}
          {type === 'EVENT' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Event location"
                disabled={isFieldDisabled()}
              />
            </div>
          )}
          
          {/* Start Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isFieldDisabled()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isFieldDisabled()}
              />
            </div>
          </div>
          
          {/* End Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isFieldDisabled()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={isFieldDisabled()}
              />
            </div>
          </div>

          {/* Global field */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={global}
                onChange={(e) => setglobal(e.target.checked)}
                disabled={isFieldDisabled()}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Is Global</span>
            </label>
          </div>

          {/* Assigned Users Multi-select Dropdown - Only show if not global */}
          {!global && (
  <div className="mb-4 relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Assigned Users
    </label>
    
    {/* Selected users chips - Updated style */}
    <div className="flex flex-wrap gap-2 mb-2">
      {assignedUserIds.map(id => {
        const user = users.find(u => u.id === id);
        if (!user) return null;
        return (
          <div 
            key={id}
            className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center"
          >
            {user.fullName}
            <button 
              type="button"
              onClick={() => toggleUser(user)}
              className="ml-2 text-gray-500 hover:text-gray-700"
              disabled={isFieldDisabled()}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
    
    {/* Dropdown trigger - Updated style */}
    <div 
      className={`border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center ${isFieldDisabled() ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !isFieldDisabled() && setDropdownOpen(!dropdownOpen)}
    >
      <span className="text-gray-500">
        {assignedUserIds.length > 0 
          ? `${assignedUserIds.length} user${assignedUserIds.length > 1 ? 's' : ''} selected` 
          : 'Select users'}
      </span>
      {!isFieldDisabled() && <ChevronDown className="h-4 w-4 text-gray-500" />}
    </div>
    
    {/* Dropdown menu */}
    {dropdownOpen && !isFieldDisabled() && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
        {/* Search input - Updated style */}
        <div className="p-2 border-b">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        {/* User list - Updated style */}
        <ul>
          {filteredUsers.map((user) => {
            const isSelected = assignedUserIds.includes(user.id);
            return (
              <li 
                key={user.id}
                className={`px-4 py-2 cursor-pointer flex items-center justify-between ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleUser(user);
                }}
              >
                <span>{user.fullName}</span>
                {isSelected && <Check className="h-4 w-4 text-blue-600" />}
              </li>
            );
          })}
          {filteredUsers.length === 0 && (
            <li className="px-4 py-2 text-gray-500 text-center">No users found</li>
          )}
        </ul>
      </div>
    )}
  </div>
)}
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            {event ? (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : (event ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;