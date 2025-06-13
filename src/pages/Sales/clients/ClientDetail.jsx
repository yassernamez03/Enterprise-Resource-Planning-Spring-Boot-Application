import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Edit, ArrowLeft, Trash2, FileText, ClipboardList, CreditCard } from "lucide-react";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import { useAppContext } from "../../../context/Sales/AppContext";
import { clientService } from "../../../services/Sales/clientService";
import { getQuotesByClient } from "../../../services/Sales/quoteService";
import { getOrdersByClient } from "../../../services/Sales/orderService";
import { getInvoicesByClient } from "../../../services/Sales/invoiceService";
import { handleForeignKeyError } from '../../../utils/errorHandlers';
import ErrorNotification from '../../../components/ErrorNotification';
import { useErrorNotification } from '../../../hooks/useErrorNotification';
// Add hashids import
import { decodeId, encodeId } from "../../../utils/hashids";

// Helper function for safe date formatting
const safeFormatDate = (dateString, formatStr) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Invalid date" : format(date, formatStr);
  } catch (e) {
    return "Invalid date";
  }
};

const ClientDetail = () => {
  const { id: hashId } = useParams(); // Get the hashed ID from URL
  const navigate = useNavigate();
  const { showNotification } = useAppContext();
  const { error, showAsDialog, showError, hideError, handleDeleteError } = useErrorNotification();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actualId, setActualId] = useState(null); // Store the decoded integer ID
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [clientSummary, setClientSummary] = useState({
    totalQuotes: 0,
    totalOrders: 0,
    totalInvoices: 0,
    lifetimeValue: 0
  });
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (hashId) {
      // Decode the hash to get the actual integer ID
      const decodedId = decodeId(hashId);
      
      if (!decodedId) {
        setError("Invalid client ID");
        setLoading(false);
        return;
      }
      
      setActualId(decodedId);
      fetchClient(decodedId); // Use the decoded integer ID for API call
    }
  }, [hashId]);

  const fetchClient = async (clientId) => {
    try {
      setLoading(true);
      const data = await clientService.getClient(clientId); // API uses integer ID
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
      showNotification("Failed to load client details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      if (!actualId) return;
      
      try {
        setActivitiesLoading(true);
        
        // Fetch all client-related data in parallel using integer ID
        const [quotes, orders, invoices] = await Promise.all([
          getQuotesByClient(actualId).catch(err => {
            console.warn("Failed to fetch quotes:", err);
            return [];
          }),
          getOrdersByClient(actualId).catch(err => {
            console.warn("Failed to fetch orders:", err);
            return [];
          }),
          getInvoicesByClient(actualId).catch(err => {
            console.warn("Failed to fetch invoices:", err);
            return [];
          })
        ]);

        // Combine all activities into a single array
        const activities = [];
        
        // Add quotes to activities
        quotes.forEach(quote => {
          activities.push({
            id: `quote-${quote.id}`,
            type: "quote",
            number: quote.quoteNumber,
            date: quote.createdAt,
            amount: quote.total || 0,
            status: quote.status === 'ACCEPTED' ? 'Approved' : 
                   quote.status === 'REJECTED' ? 'Rejected' : 'Pending',
            entityId: quote.id // Store original ID for navigation
          });
        });

        // Add orders to activities
        orders.forEach(order => {
          activities.push({
            id: `order-${order.id}`,
            type: "order",
            number: order.orderNumber,
            date: order.createdAt,
            amount: order.totalAmount || 0,
            status: order.status === 'COMPLETED' ? 'Completed' : 
                   order.status === 'CANCELLED' ? 'Cancelled' : 'Processing',
            entityId: order.id // Store original ID for navigation
          });
        });

        // Add invoices to activities
        invoices.forEach(invoice => {
          activities.push({
            id: `invoice-${invoice.id}`,
            type: "invoice",
            number: invoice.invoiceNumber,
            date: invoice.createdAt,
            amount: invoice.total || 0,
            status: invoice.status === 'paid' ? 'Paid' : 
                   invoice.status === 'partial' ? 'Partial' : 'Pending',
            entityId: invoice.id // Store original ID for navigation
          });
        });

        // Sort activities by date (most recent first)
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Take only the 5 most recent activities
        setRecentActivities(activities.slice(0, 5));

        // Calculate summary data
        const totalQuoteValue = quotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
        const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const totalInvoiceValue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        
        // Lifetime value is typically the sum of all completed orders or paid invoices
        const lifetimeValue = invoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + (invoice.total || 0), 0);

        setClientSummary({
          totalQuotes: quotes.length,
          totalOrders: orders.length,
          totalInvoices: invoices.length,
          lifetimeValue: lifetimeValue
        });

      } catch (error) {
        console.error("Error fetching client data:", error);
        showNotification("Failed to load client activity data", "error");
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchClientData();
  }, [actualId, showNotification]);

  const handleBack = () => {
    navigate("/sales/clients")
  }

  const handleEdit = () => {
    navigate(`/sales/clients/${hashId}/edit`) // Use the original hash in the edit link
  }

  const handleDeletePrompt = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!actualId) return;

    try {
      await clientService.deleteClient(actualId); // Use integer ID for API
      showNotification(`Client ${client.name} deleted successfully`, "success");
      navigate("/sales/clients");
    } catch (error) {
      console.log("CLIENT DETAIL DELETE FAILED:", error);
      handleDeleteError(error, 'Client', client.name);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }
  
  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

        <div className="bg-white rounded-lg shadow-card p-6 mb-8">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-700">Client not found</h2>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Clients
        </button>
      </div>
    )
  }

  const getActivityIcon = type => {
    switch (type) {
      case "quote":
        return <FileText size={18} className="text-primary-500" />
      case "order":
        return <ClipboardList size={18} className="text-success-500" />
      case "invoice":
        return <CreditCard size={18} className="text-warning-500" />
      default:
        return <FileText size={18} className="text-gray-500" />
    }
  }

  const getActivityStatusColor = status => {
    switch (status.toLowerCase()) {
      case "approved":
      case "paid":
      case "completed":
        return "bg-success-100 text-success-800"
      case "pending":
        return "bg-warning-100 text-warning-800"
      case "processing":
        return "bg-primary-100 text-primary-800"
      case "rejected":
      case "cancelled":
        return "bg-error-100 text-error-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityLink = (activity) => {
    // Use encoded IDs for navigation
    switch (activity.type) {
      case "quote":
        return `/sales/quotes/${encodeId(activity.entityId)}`;
      case "order":
        return `/sales/orders/${encodeId(activity.entityId)}`;
      case "invoice":
        return `/sales/invoices/${encodeId(activity.entityId)}`;
      default:
        return '#';
    }
  }

  return (
    <div>
      <div className="flex items-center mb-2">
        <button
          onClick={handleBack}
          className="inline-flex items-center mr-3 text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <p className="text-gray-600">
            Client ID: {hashId} • Created on{" "}
            {safeFormatDate(client.createdAt, "PPP")}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit size={16} className="mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeletePrompt}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Client Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{client.email}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-800">{client.phone}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-800">{client.address}</p>
                  <p className="text-gray-800">
                    {client.city}, {client.state} {client.zipCode}
                  </p>
                  <p className="text-gray-800">{client.country}</p>
                </div>
              </div>

              <div>
                {client.taxId && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Tax ID / VAT Number</p>
                    <p className="text-gray-800">{client.taxId}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="text-gray-800">
                    {safeFormatDate(client.updatedAt, "PPP")}
                  </p>
                </div>

                {client.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-800 whitespace-pre-line">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">
                Recent Transactions
              </h2>
              <button
                onClick={() => navigate(`/sales/clients/${hashId}/transactions`)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </button>
            </div>

            {activitiesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-3">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">
                  This client hasn't had any quotes, orders, or invoices yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(getActivityLink(activity))}
                          className="font-medium text-blue-600 hover:text-blue-800 text-left"
                        >
                          {activity.number}
                        </button>
                        <p className="text-sm text-gray-500">
                          {safeFormatDate(activity.date, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-gray-800">
                        ${(activity.amount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${getActivityStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Summary</h2>

            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-600">Total Quotes</p>
                  <p className="font-medium">{clientSummary.totalQuotes}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Total Orders</p>
                  <p className="font-medium">{clientSummary.totalOrders}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Total Invoices</p>
                  <p className="font-medium">{clientSummary.totalInvoices}</p>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <div className="flex justify-between">
                    <p className="text-gray-800 font-medium">Lifetime Value</p>
                    <p className="font-bold text-primary-600">
                      ${clientSummary.lifetimeValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => navigate(`/sales/quotes/new`)}
                className="block w-full text-left px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-2" />
                  <span>Create New Quote</span>
                </div>
              </button>
              <button
                onClick={() => navigate(`/sales/orders/new`)}
                className="block w-full text-left px-4 py-2 bg-success-50 text-success-700 rounded-md hover:bg-success-100 transition-colors"
              >
                <div className="flex items-center">
                  <ClipboardList size={18} className="mr-2" />
                  <span>Create New Order</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Client"
        message={`Are you sure you want to delete ${client.name}? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
      
      <ConfirmDialog
        isOpen={errorDialogOpen}
        title="Cannot Delete Client"
        message={errorMessage}
        confirmText="OK"
        onConfirm={handleErrorDialogClose}
        onCancel={handleErrorDialogClose}
        type="warning"
        showCancelButton={false}
      />

      <ErrorNotification
        error={error}
        onClose={hideError}
        showAsDialog={showAsDialog}
        title="Cannot Delete Client"
      />
    </div>
  )
}

export default ClientDetail