import React from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ status, className = '', animate = false }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTIVE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'INVESTIGATING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OPEN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const badge = (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${className}`}
    >
      {status === 'ACTIVE' && animate && (
        <span className="w-2 h-2 bg-current rounded-full mr-1 animate-pulse" />
      )}
      {status}
    </span>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
};

export default StatusBadge;