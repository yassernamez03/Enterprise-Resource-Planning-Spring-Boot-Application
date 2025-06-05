import React from 'react';

const DateSeparator = ({ date, darkMode }) => {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
      <div 
        className={`mx-4 px-3 py-1 text-xs font-medium rounded-full ${
          darkMode 
            ? 'bg-gray-700 text-gray-300 border border-gray-600' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}
      >
        {date}
      </div>
      <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
    </div>
  );
};

export default DateSeparator;