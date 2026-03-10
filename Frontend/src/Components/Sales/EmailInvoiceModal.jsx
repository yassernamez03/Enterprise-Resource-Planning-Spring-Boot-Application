import React, { useState } from 'react';
import { X, Mail, Send, AlertCircle } from 'lucide-react';

const EmailInvoiceModal = ({ 
  isOpen, 
  onClose, 
  invoice, 
  onSendEmail,
  isLoading = false 
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!invoice) return;
    
    try {
      setError('');
      await onSendEmail(customMessage);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send email');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Mail className="mr-2 text-blue-600" size={20} />
            <h2 className="text-xl font-semibold">Email Invoice</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
            <AlertCircle className="mr-2 text-red-500" size={16} />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <div className="mb-4">
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Invoice Details:</h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Invoice #:</span> {invoice?.invoiceNumber}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Client:</span> {invoice?.clientName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Amount:</span> ${parseFloat(invoice?.total || 0).toFixed(2)}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a custom message to include with the invoice..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailInvoiceModal;