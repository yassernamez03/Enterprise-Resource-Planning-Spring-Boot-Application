import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Shield, AlertTriangle } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const AlertsList = ({ alerts, isLoading = false, onAlertClick }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${
                alert.severity === 'CRITICAL' ? 'bg-red-100' :
                alert.severity === 'HIGH' ? 'bg-orange-100' :
                alert.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  alert.severity === 'CRITICAL' ? 'text-red-600' :
                  alert.severity === 'HIGH' ? 'text-orange-600' :
                  alert.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{alert.title}</h3>
                  <StatusBadge status={alert.severity} animate />
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{alert.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                  
                  {alert.sourceIp && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {alert.sourceIp}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{alert.alertType.replace('_', ' ').toLowerCase()}</span>
                  </div>
                </div>

                {alert.affectedUsers && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">{alert.affectedUsers}</span> users potentially affected
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {alerts.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
          <p className="text-gray-500">Your system is secure and running smoothly.</p>
        </motion.div>
      )}
    </div>
  );
};

export default AlertsList;