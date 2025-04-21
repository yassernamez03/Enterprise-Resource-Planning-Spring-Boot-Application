import React, { useState } from 'react';
import { ArrowLeft, Calendar, CheckSquare, Clock, Tag } from 'lucide-react';

const TaskDetailView = ({ task, onBack, onStatusChange }) => {
  const [isToggling, setIsToggling] = useState(false);

  // Handle task status toggle with loading state
  const handleStatusToggle = () => {
    setIsToggling(true);
    
    // Add a small delay for better UX
    setTimeout(async () => {
      try {
        await onStatusChange(task.id);
      } finally {
        setIsToggling(false);
      }
    }, 300);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-3 p-2 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-xl font-medium text-slate-800">Task Details</h2>
      </div>
      
      <div className="border-b pb-6 mb-6">
        <div className="flex justify-between items-start">
          <h3 className={`text-xl font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
            {task.title}
          </h3>
          <button
            onClick={handleStatusToggle}
            disabled={isToggling}
            className={`flex items-center px-3 py-1.5 rounded-lg ${
              task.status === 'completed' 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            } transition duration-150 disabled:opacity-70`}
          >
            {isToggling ? (
              <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-current rounded-full mr-1.5"></div>
            ) : (
              <CheckSquare size={16} className="mr-1.5" />
            )}
            {task.status === 'completed' ? 'Completed' : 'Mark as Complete'}
          </button>
        </div>
        
        <div className="flex flex-wrap mt-4 space-x-4">
          <div className="flex items-center text-sm text-slate-600">
            <Calendar size={16} className="mr-1.5 text-indigo-600" />
            <span>Due: {task.deadline}</span>
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Tag size={16} className="mr-1.5 text-indigo-600" />
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              task.category === 'Finance' ? 'bg-blue-100 text-blue-800' : 
              task.category === 'Legal' ? 'bg-purple-100 text-purple-800' : 
              'bg-teal-100 text-teal-800'
            }`}>
              {task.category}
            </span>
          </div>
          <div className="flex items-center text-sm text-slate-600">
            <Clock size={16} className="mr-1.5 text-indigo-600" />
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              task.priority === 'High' ? 'bg-red-100 text-red-800' : 
              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {task.priority} Priority
            </span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-medium text-slate-800 mb-3">Description</h4>
        <p className="text-slate-600 whitespace-pre-line">
          {task.description}
        </p>
      </div>
      
      {/* Additional sections could be added here, like comments, attachments, etc. */}
      <div className="mt-8 border-t pt-6">
        <h4 className="text-lg font-medium text-slate-800 mb-3">Actions</h4>
        <div className="flex space-x-3">
          <button 
            onClick={onBack}
            className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition duration-150"
          >
            Back to Overview
          </button>
          <button 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-150"
          >
            Edit Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailView;