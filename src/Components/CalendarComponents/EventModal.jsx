import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useCalendar } from '../../context/CalendarContext';
import { formatDate, formatTime } from '../../utils/dateUtils';
import EventForm from './EventForm';

const EventModal = ({ event, onClose }) => {
const [isEditing, setIsEditing] = useState(false);
const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
const { deleteEvent } = useCalendar();

const handleDelete = () => {
    deleteEvent(event.id);
    onClose();
};

if (isEditing) {
    return <EventForm event={event} onClose={() => setIsEditing(false)} />;
}

return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    {/* Main Event Modal */}
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
            <div
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: event.color }}
            ></div>
            <h2 className="text-xl font-semibold">{event.title}</h2>
        </div>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
        >
            <X className="h-5 w-5" />
        </button>
        </div>
        
        <div className="space-y-4">
        <div>
            <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
            <p className="mt-1">
            {formatDate(event.start)}
            <br />
            {formatTime(event.start)} - {formatTime(event.end)}
            </p>
        </div>
        
        {event.description && (
            <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1">{event.description}</p>
            </div>
        )}
        
        <div>
            <h3 className="text-sm font-medium text-gray-500">Priority</h3>
            <p className="mt-1">{event.priority}</p>
        </div>
        
        <div>
            <h3 className="text-sm font-medium text-gray-500">Global Event</h3>
            <p className="mt-1">{event.global ? 'Yes' : 'No'}</p>
        </div>
        
        {event.assignedUserIds && event.assignedUserIds.length > 0 && (
            <div>
            <h3 className="text-sm font-medium text-gray-500">Assigned Users</h3>
            <p className="mt-1">{event.assignedUserIds.join(', ')}</p>
            </div>
        )}
        
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
            Are you sure you want to delete "<span className="font-semibold">{event.title}</span>"? 
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
    </div>
);
};

export default EventModal;