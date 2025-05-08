import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

// Sample employees data - in a real app, this would come from your backend or context
const EMPLOYEES = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Sarah Johnson' },
  { id: '3', name: 'Michael Chen' },
  { id: '4', name: 'Emily Davis' },
  { id: '5', name: 'Robert Wilson' },
  { id: '6', name: 'Lisa Brown' },
  { id: '7', name: 'David Lee' },
  { id: '8', name: 'Amanda Taylor' }
];

const EventForm = ({ event, onClose }) => {
  const { addEvent, updateEvent, deleteEvent } = useCalendar();
  
  // State for form fields
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(
    event?.start ? 
      new Date(event.start).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState(
    event?.start ? 
      new Date(event.start).toTimeString().slice(0, 5) : 
      '09:00'
  );
  const [endDate, setEndDate] = useState(
    event?.end ? 
      new Date(event.end).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0]
  );
  const [endTime, setEndTime] = useState(
    event?.end ? 
      new Date(event.end).toTimeString().slice(0, 5) : 
      '10:00'
  );
  const [color, setColor] = useState(event?.color || COLORS[0]);
  const [priority, setPriority] = useState(event?.priority || 'Medium');
  const [global, setGlobal] = useState(event?.global || false);
  
  // Employee selection states
  const [assignedEmployees, setAssignedEmployees] = useState(event?.assignedEmployees || []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Convert between employee objects and IDs when needed
  const getEmployeesByIds = (ids) => {
    return EMPLOYEES.filter(emp => ids.includes(emp.id));
  };

  // Initialize assigned employees on load
  useEffect(() => {
    if (event?.assignedUserIds?.length) {
      setAssignedEmployees(getEmployeesByIds(event.assignedUserIds));
    }
  }, [event]);

  // Filtered employees for search
  const filteredEmployees = EMPLOYEES.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleEmployee = (employee) => {
    if (assignedEmployees.some(emp => emp.id === employee.id)) {
      setAssignedEmployees(assignedEmployees.filter(emp => emp.id !== employee.id));
    } else {
      setAssignedEmployees([...assignedEmployees, employee]);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    // Validate dates
    if (end <= start) {
      alert('End time must be after start time');
      return;
    }
    
    const eventData = {
      id: event?.id,
      title,
      description,
      start,
      end,
      color,
      priority,
      global,
      assignedUserIds: assignedEmployees.map(emp => emp.id),
      assignedEmployees, // Store the full employee objects for display purposes
    };
    
    if (event) {
      updateEvent(eventData);
    } else {
      addEvent(eventData);
    }
    
    onClose();
  };

  // Handle event deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div>
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
            />
          </div>
          
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
              />
            </div>
          </div>
          
          {/* End Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          
          {/* Priority Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          {/* Global Checkbox */}
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={global}
                onChange={(e) => setGlobal(e.target.checked)}
                className="form-checkbox"
              />
              <span className="ml-2">Global Event</span>
            </label>
          </div>
          
          {/* Assigned Employees Multi-select Dropdown */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Employees
            </label>
            
            {/* Selected employees chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {assignedEmployees.map((emp) => (
                <div 
                  key={emp.id}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
                  {emp.name}
                  <button 
                    type="button"
                    onClick={() => toggleEmployee(emp)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Dropdown trigger */}
            <div 
              className="border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="text-gray-500">
                {assignedEmployees.length > 0 
                  ? `${assignedEmployees.length} employee${assignedEmployees.length > 1 ? 's' : ''} selected` 
                  : 'Select employees'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
            
            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {/* Search input */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* Employee list */}
                <ul>
                  {filteredEmployees.map((emp) => {
                    const isSelected = assignedEmployees.some(e => e.id === emp.id);
                    return (
                      <li 
                        key={emp.id}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEmployee(emp);
                        }}
                      >
                        <span>{emp.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </li>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <li className="px-3 py-2 text-gray-500 text-center">No employees found</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* Color Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            {event ? (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventForm;