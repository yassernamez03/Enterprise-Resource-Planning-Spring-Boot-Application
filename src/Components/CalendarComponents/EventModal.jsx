import React, { useState } from 'react';
import { X, AlertTriangle, Check, Clock, Globe, CheckCircle } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { formatDate, formatTime } from '../../utils/dateUtils';
import EventForm from './EventForm';
import { useAuth } from "../../context/AuthContext";
import calendarService from '../../services/calanderService';

const EventModal = ({ event, onClose }) => {
const [isEditing, setIsEditing] = useState(false);
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
const [showSuccessAlert, setShowSuccessAlert] = useState(false);
const [successMessage, setSuccessMessage] = useState('');
const { deleteEvent, refreshEvents } = useCalendar();
const { user, logout } = useAuth();
const isAdmin = user?.role === 'ADMIN';
const isCompleted = event?.status === 'COMPLETED' || event?.status === 'COMPLETED' || event?.status === 'COMPLETED';
console.log("isCompleted = " + isCompleted);

// Function to determine event color based on type
const getEventColor = (event) => {
    const type = event?.type;
    switch (type) {
    case 'EVENT':
        return '#10b981'; // Green
    case 'TASK':
        return '#3b82f6'; // Blue
    default:
        return '#9ca3af'; // Gray if undefined or unknown
    }
};

const handleDelete = async () => {
    try {
    await deleteEvent(event.id);
    setSuccessMessage('Event deleted successfully!');
    setShowSuccessAlert(true);
    setTimeout(() => {
        setShowSuccessAlert(false);
        onClose();
    }, 2000);
    } catch (error) {
    console.error('Error deleting event:', error);
    }
};

const handleCompleteTask = async () => {
    try {
        console.log("id = " + event.id)
        console.log("event = " + event);
        
        await calendarService.toggleTaskCompletion(event.id);
        setSuccessMessage('Task marked as completed successfully!');
        setShowSuccessAlert(true);
        refreshEvents();
        
        setTimeout(() => {
            setShowSuccessAlert(false);
            setShowCompleteConfirmation(false);
            onClose();
        }, 2000);
    } catch (error) {
        console.error('Error completing task:', error);
        setSuccessMessage('Failed to complete task. Please try again.');
        setShowSuccessAlert(true);
        setTimeout(() => {
            setShowSuccessAlert(false);
        }, 2000);
    }
};

const handleEditSuccess = () => {
    setSuccessMessage('Event updated successfully!');
    setShowSuccessAlert(true);
    refreshEvents();
    setTimeout(() => {
    setShowSuccessAlert(false);
    setIsEditing(false);
    }, 2000);
};

// Return a label for the status
const getStatusLabel = (status) => {
    if (!status) return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };

    switch (status.toUpperCase()) {
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
        return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    case 'COMPLETED':
        return { label: 'COMPLETED', color: 'bg-green-100 text-green-800' };
    default:
        return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
    }
};

if (isEditing) {
    return (
    <>
        <EventForm 
        event={event} 
        onClose={() => setIsEditing(false)} 
        onSuccess={handleEditSuccess}
        />
        {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 text-green-800 rounded-md shadow-lg flex items-center animate-fade-in">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
        </div>
        )}
    </>
    );
}

// Determine if this is a task (using uppercase comparison)
const isTask = event.type === 'TASK';

// Get status information if this is a task
const statusInfo = isTask ? getStatusLabel(event.status) : null;

// Format dates
const startDate = new Date(event.startTime);
const endDate = new Date(event.dueDate);
const completedDate = event.completedDate ? new Date(event.completedDate) : null;

return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    {/* Success Alert */}
    {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-green-100 text-green-800 rounded-md shadow-lg flex items-center animate-fade-in">
        <Check className="h-5 w-5 mr-2" />
        <span>{successMessage}</span>
        </div>
    )}

    {/* Main Event Modal */}
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
            <div
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: getEventColor(event) }}
            ></div>
            <h2 className="text-xl font-semibold">
            {event.title}
            <span className="ml-2 text-sm font-normal text-gray-500">
                ({isTask ? 'Task' : 'Event'})
            </span>
            </h2>
        </div>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
        >
            <X className="h-5 w-5" />
        </button>
        </div>
        
        <div className="space-y-4">
        {/* Global Indicator */}
        {event.global && (
            <div className="flex items-center text-sm text-blue-600">
            <Globe className="h-4 w-4 mr-1" />
            <span>Global {event.type}</span>
            </div>
        )}

        {/* Task Status (only for tasks) */}
        {isTask && statusInfo && (
            <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium mt-1 ${statusInfo.color}`}>
                {statusInfo.label === 'Completed' ? (
                <Check className="mr-1 h-3 w-3" />
                ) : (
                <Clock className="mr-1 h-3 w-3" />
                )}
                {statusInfo.label}
            </div>
            </div>
        )}

        {/* Date and Time */}
        <div>
            <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
            <p className="mt-1">
            {formatDate(startDate)}
            <br />
            {formatTime(startDate)} - {formatTime(endDate)}
            </p>
        </div>
        
        {/* Location (only for events) */}
        {!isTask && event.location && (
            <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="mt-1">{event.location}</p>
            </div>
        )}
        
        {/* Description */}
        {event.description && (
            <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{event.description}</p>
            </div>
        )}
        
        {/* Assigned Employees */}
        {event.assignedUserIds && event.assignedUserIds.length > 0 && (
            <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned Employees</h3>
            <div className="flex flex-wrap gap-2 mt-1">
                {event.assignedUserIds.map((id) => (
                <div 
                    key={id}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
                    User ID: {id}
                </div>
                ))}
            </div>
            </div>
        )}
        
        {/* Action Buttons */}
        {isAdmin && (
        <div className="flex justify-end space-x-2 pt-4">
            <button
            onClick={() => setShowDeleteConfirmation(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
            Delete
            </button>
            <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
            Edit
            </button>
        </div>
        )}
        {isTask && !isCompleted && !isAdmin &&(
        <div className="flex justify-end space-x-2 pt-4">
            <button
                onClick={() => setShowCompleteConfirmation(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
                Mark as Completed
            </button>
        </div>
        )}
        </div>
    </div>

    {/* Delete Confirmation Modal */}
    {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
            <h2 className="text-xl font-semibold">Confirm Delete</h2>
            </div>
            
            <p className="mb-6">
            Are you sure you want to delete this {isTask ? 'task' : 'event'} 
            "<span className="font-semibold">{event.title}</span>"?
            This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
            <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
                Delete
            </button>
            </div>
        </div>
        </div>
    )}

    {/* Completion Confirmation Modal */}
{showCompleteConfirmation && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
      <div className="flex items-center mb-4">
        <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
        <h2 className="text-xl font-semibold">Confirm Completion</h2>
      </div>
      
      <p className="mb-6">
        Are you sure you want to mark this task
        "<span className="font-semibold">{event.title}</span>" as completed?
      </p>
      
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setShowCompleteConfirmation(false)}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCompleteTask}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Confirm Complete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
);
};

export default EventModal;