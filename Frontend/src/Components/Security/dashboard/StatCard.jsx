import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  isLoading = false 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50'
  };

  const [bgColor, textColor, cardBg] = colorClasses[color].split(' ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`${cardBg} overflow-hidden shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-all duration-300`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {isLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl font-bold text-gray-900"
              >
                {value}
              </motion.p>
            )}
            {change && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center mt-2"
              >
                <span className={`text-sm font-medium ${
                  change.type === 'increase' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
                </span>
                <span className="text-xs text-gray-500 ml-1">vs last week</span>
              </motion.div>
            )}
          </div>
          <div className={`${bgColor} p-3 rounded-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;