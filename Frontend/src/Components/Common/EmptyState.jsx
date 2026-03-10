import React from 'react';

const EmptyState = ({ 
  icon, 
  title, 
  message, 
  actionText, 
  onAction 
}) => {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-lg border border-gray-200">
      {icon && (
        <div className="mx-auto flex items-center justify-center h-16 w-16 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      {title && <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>}
      {message && <p className="text-sm text-gray-500 mb-6">{message}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;