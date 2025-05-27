import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CreateTaskModal({
isOpen,
onClose,
formData,
handleInputChange,
handleSubmit,
assignedEmployee
}) {
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState(null);
const [timeError, setTimeError] = useState(null);

if (!isOpen) return null;

// Format datetime for input fields (handle null/undefined)
const formatDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Enhanced handleInputChange with time validation
const enhancedHandleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : value;
    handleInputChange({ target: { name, value: newValue } });

    // Validate startTime and dueDate
    if (name === 'startTime' || name === 'dueDate') {
    const currentStart = name === 'startTime' ? value : formData.startTime;
    const currentDue = name === 'dueDate' ? value : formData.dueDate;
    
    if (currentStart && currentDue) {
        const start = new Date(currentStart);
        const due = new Date(currentDue);
        
        if (start >= due) {
        setTimeError('Start time must be before due time');
        } else {
        setTimeError(null);
        }
    } else {
        setTimeError(null);
    }
    }
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation check
    if (formData.startTime && formData.dueDate) {
    const start = new Date(formData.startTime);
    const due = new Date(formData.dueDate);
    if (start >= due) {
        setTimeError('Start time must be before due time');
        return;
    }
    }

    setIsSubmitting(true);
    setError(null);
    setTimeError(null);
    
    try {
    await handleSubmit(e);
    onClose();
    } catch (err) {
    setError(err.message || 'Failed to create task. Please try again.');
    } finally {
    setIsSubmitting(false);
    }
};

return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <form onSubmit={handleFormSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-2xl font-semibold leading-6 text-gray-900 mb-6">
                    Create New Task
                </h3>
                
                {(error || timeError) && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error || timeError}
                    </div>
                )}
                
                <div className="mt-2 space-y-6">
                    <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        placeholder="Enter task title"
                        value={formData.title || ''}
                        onChange={enhancedHandleInputChange}
                        required
                    />
                    </div>
                    
                    <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        placeholder="Describe the task details"
                        value={formData.description || ''}
                        onChange={enhancedHandleInputChange}
                    />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                        </label>
                        <input
                        type="datetime-local"
                        name="startTime"
                        id="startTime"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        value={formatDateTimeLocal(formData.startTime)}
                        onChange={enhancedHandleInputChange}
                        required
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date *
                        </label>
                        <input
                        type="datetime-local"
                        name="dueDate"
                        id="dueDate"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        value={formatDateTimeLocal(formData.dueDate)}
                        onChange={enhancedHandleInputChange}
                        required
                        />
                    </div>
                    </div>
                    
                    <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                    </label>
                    <select
                        id="status"
                        name="status"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                        value={formData.status || 'PENDING'}
                        onChange={enhancedHandleInputChange}
                        required
                    >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned Employee
                    </label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold">
                        {assignedEmployee ? (
                        <span className="inline-flex items-center">
                            <span className="ml-2">{assignedEmployee.firstName} {assignedEmployee.lastName}</span>
                        </span>
                        ) : 'No employee selected'}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        Task will be automatically assigned to {assignedEmployee ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}` : 'selected employee'}
                    </p>
                    </div>
                </div>
                </div>
            </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:items-center sm:justify-between">
            <div className="flex space-x-3">
                <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:text-sm disabled:opacity-75"
                disabled={isSubmitting || timeError}
                >
                {isSubmitting ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                    </>
                ) : 'Create Task'}
                </button>
                
                <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:text-sm"
                onClick={onClose}
                disabled={isSubmitting}
                >
                Cancel
                </button>
            </div>
            
            <p className="mt-2 text-xs text-gray-500 sm:mt-0">
                Fields marked with * are required
            </p>
            </div>
        </form>
        </div>
    </div>
    </div>
);
}