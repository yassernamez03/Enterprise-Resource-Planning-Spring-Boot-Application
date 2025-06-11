import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Edit, ArrowLeft, Trash2, FileText, ClipboardList, CreditCard } from "lucide-react";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import { useAppContext } from "../../../context/Sales/AppContext";
import { clientService } from "../../../services/Sales/clientService";
import { handleForeignKeyError } from '../../../utils/errorHandlers';
import ErrorNotification from '../../../components/ErrorNotification';
import { useErrorNotification } from '../../../hooks/useErrorNotification';

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

// Mock activity data
const MOCK_ACTIVITIES = [
  {
    id: 1,
    type: "quote",
    number: "Q-1001",
    date: "2023-05-15",
    amount: 5000,
    status: "Approved"
  },
  {
    id: 2,
    type: "order",
    number: "ORD-2001",
    date: "2023-05-20",
    amount: 5000,
    status: "Processing"
  },
  {
    id: 3,
    type: "invoice",
    number: "INV-3001",
    date: "2023-05-25",
    amount: 5000,
    status: "Paid"
  },
  {
    id: 4,
    type: "quote",
    number: "Q-1002",
    date: "2023-06-10",
    amount: 3500,
    status: "Pending"
  }
]

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useAppContext();
  const { error, showAsDialog, showError, hideError, handleDeleteError } = useErrorNotification();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const data = await clientService.getClient(id);
        setClient(data);
      } catch (error) {
        console.error("Error fetching client:", error);
        showNotification("Failed to load client details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id, showNotification]);

  const handleBack = () => {
    navigate("/sales/clients")
  }

  const handleEdit = () => {
    navigate(`/sales/clients/${id}/edit`)
  }

  const handleDeletePrompt = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await clientService.deleteClient(client.id);
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
        return "bg-success-100 text-success-800"
      case "pending":
        return "bg-warning-100 text-warning-800"
      case "processing":
        return "bg-primary-100 text-primary-800"
      case "rejected":
        return "bg-error-100 text-error-800"
      default:
        return "bg-gray-100 text-gray-800"
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
            Client ID: {client.id} • Created on{" "}
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
              <a
                href="#"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </a>
            </div>

            {MOCK_ACTIVITIES.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No transactions found
              </p>
            ) : (
              <div className="space-y-4">
                {MOCK_ACTIVITIES.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {activity.number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {safeFormatDate(activity.date, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-gray-800">
                        ${activity.amount.toLocaleString()}
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

            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-600">Total Quotes</p>
                <p className="font-medium">2</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Total Orders</p>
                <p className="font-medium">1</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Total Invoices</p>
                <p className="font-medium">1</p>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <p className="text-gray-800 font-medium">Lifetime Value</p>
                  <p className="font-bold text-primary-600">$8,500.00</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <a
                href="#"
                className="block w-full text-left px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-2" />
                  <span>Create New Quote</span>
                </div>
              </a>
              <a
                href="#"
                className="block w-full text-left px-4 py-2 bg-success-50 text-success-700 rounded-md hover:bg-success-100 transition-colors"
              >
                <div className="flex items-center">
                  <ClipboardList size={18} className="mr-2" />
                  <span>Create New Order</span>
                </div>
              </a>
              <a
                href="#"
                className="block w-full text-left px-4 py-2 bg-warning-50 text-warning-700 rounded-md hover:bg-warning-100 transition-colors"
              >
                <div className="flex items-center">
                  <CreditCard size={18} className="mr-2" />
                  <span>Create New Invoice</span>
                </div>
              </a>
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