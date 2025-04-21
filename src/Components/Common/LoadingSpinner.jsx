import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  // Size variants
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-600 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-2 text-sm text-slate-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;