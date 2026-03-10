import { useState } from 'react';

export const useErrorNotification = () => {
  const [error, setError] = useState(null);
  const [showAsDialog, setShowAsDialog] = useState(false);

  const showError = (errorMessage, asDialog = false) => {
    console.error('Error notification:', errorMessage);
    setError(errorMessage);
    setShowAsDialog(asDialog);
  };

  const hideError = () => {
    setError(null);
    setShowAsDialog(false);
  };

  const handleDeleteError = (error, entityName, entityTitle) => {
    console.error('Delete error:', error);
    
    // Check for foreign key constraint errors
    const errorMessage = error.response?.data?.message || error.response?.data || error.message || '';
    const isForeignKeyError = 
      errorMessage.includes("violates foreign key constraint") ||
      errorMessage.includes("foreign key constraint fails") ||
      errorMessage.includes("cannot be deleted") ||
      errorMessage.includes("has dependent records") ||
      errorMessage.includes("referenced by") ||
      errorMessage.includes("fk") ||
      error.response?.status === 409;

    if (isForeignKeyError) {
      const message = getForeignKeyMessage(entityName, entityTitle);
      showError(message, true); // Show as dialog for foreign key errors
    } else {
      showError(`Failed to delete ${entityTitle}.`);
    }
  };

  const getForeignKeyMessage = (entityName, entityTitle) => {
    const baseMessage = `Cannot delete "${entityTitle}" because it has associated records.`;
    
    switch (entityName.toLowerCase()) {
      case 'client':
        return `${baseMessage}\n\nPlease delete all associated quotes, orders, and invoices before removing this client.`;
      case 'product':
        return `${baseMessage}\n\nPlease remove this product from all quotes and orders before deleting it.`;
      case 'quote':
        return `${baseMessage}\n\nThis quote may be referenced by orders or other documents.`;
      case 'order':
        return `${baseMessage}\n\nThis order may be referenced by invoices or other documents.`;
      case 'invoice':
        return `${baseMessage}\n\nThis invoice may have associated payments or other references.`;
      default:
        return `${baseMessage}\n\nPlease remove all associated records before deleting this ${entityName.toLowerCase()}.`;
    }
  };

  return {
    error,
    showAsDialog,
    showError,
    hideError,
    handleDeleteError
  };
};