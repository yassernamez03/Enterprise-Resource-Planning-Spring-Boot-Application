export const handleForeignKeyError = (error, entityName, entityTitle) => {
  // Check for various foreign key constraint error patterns
  const errorMessage = error.response?.data?.message || error.response?.data || error.message || '';
  
  const isForeignKeyError = 
    errorMessage.includes("violates foreign key constraint") ||
    errorMessage.includes("foreign key constraint fails") ||
    errorMessage.includes("cannot be deleted") ||
    errorMessage.includes("has dependent records") ||
    errorMessage.includes("referenced by") ||
    errorMessage.includes("fk") || // Generic foreign key reference
    error.response?.status === 409; // Conflict status often used for constraint violations

  if (isForeignKeyError) {
    return {
      isForeignKeyError: true,
      message: getForeignKeyErrorMessage(entityName, entityTitle, errorMessage)
    };
  }

  return {
    isForeignKeyError: false,
    message: errorMessage || `Failed to delete ${entityName.toLowerCase()}`
  };
};

const getForeignKeyErrorMessage = (entityName, entityTitle, originalError) => {
  const baseMessage = `Cannot delete ${entityTitle} because it has associated records.`;
  
  // Customize message based on entity type
  switch (entityName.toLowerCase()) {
    case 'client':
      return `${baseMessage} Please delete all associated quotes, orders, and invoices before removing this client.`;
    case 'product':
      return `${baseMessage} Please remove this product from all quotes and orders before deleting it.`;
    case 'quote':
      return `${baseMessage} This quote may be referenced by orders or other documents.`;
    case 'order':
      return `${baseMessage} This order may be referenced by invoices or other documents.`;
    case 'invoice':
      return `${baseMessage} This invoice may have associated payments or other references.`;
    default:
      return `${baseMessage} Please remove all associated records before deleting this ${entityName.toLowerCase()}.`;
  }
};