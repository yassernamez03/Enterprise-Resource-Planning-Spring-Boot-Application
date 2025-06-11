import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { getInvoices, deleteInvoice, getInvoicesByStatus, searchInvoices } from "../../../services/Sales/invoiceService"
import { generateInvoicePdf, downloadPdf } from "../../../services/Sales/pdfService"
import {
  Search,
  Filter,
  FileText,
  Download,
  DollarSign,
  Trash2
} from "lucide-react"
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog"
import { handleForeignKeyError } from '../../../utils/errorHandlers';
import ErrorNotification from '../../../components/ErrorNotification';
import { useErrorNotification } from '../../../hooks/useErrorNotification';

// Map backend status enum values (uppercase) to frontend display values
const statusLabels = {
  pending: "Pending",
  partial: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  // Backend enum values
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  PARTIAL: "Partially Paid"
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  partial: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  // Backend enum values
  PENDING: "bg-yellow-100 text-yellow-800",
  PARTIAL: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800"
}

const InvoiceList = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    invoiceId: "",
    invoiceNumber: ""
  })
  const { error: deleteError, showAsDialog, showError, hideError, handleDeleteError } = useErrorNotification();

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    filterInvoices()
  }, [invoices, searchTerm]) // removed statusFilter since we handle it separately

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await getInvoices()
      // Check if response has the data property (paginated response)
      const data = response.data || response
      setInvoices(data)
      setFilteredInvoices(data)
    } catch (err) {
      setError("Failed to fetch invoices")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const filterInvoices = () => {
    let filtered = [...invoices]

    if (searchTerm) {
      filtered = filtered.filter(
        invoice =>
          (invoice.invoiceNumber || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (invoice.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (invoice.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(invoice => {
        // Handle both lowercase frontend status and uppercase backend enum status
        const invoiceStatus = (invoice.status || '').toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        return invoiceStatus === filterStatus;
      })
    }    setFilteredInvoices(filtered);
  };
  
  const handleSearch = async (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    
    try {
      if (term.length > 2) {
        // Use the backend search API for more than 2 characters
        setLoading(true);
        const results = await searchInvoices(term);
        const data = Array.isArray(results) ? results : [];
        setFilteredInvoices(data);
      } else if (term === "") {
        // Reset to all invoices if search is cleared
        setFilteredInvoices(invoices);
      } else {
        // For 1-2 characters, just use client-side filtering
        filterInvoices();
      }
    } catch (err) {
      console.error("Search error:", err);
      // Fall back to client-side filtering on error
      filterInvoices();
    } finally {
      setLoading(false);
    }
  }
  
  const handleStatusFilter = async (status) => {
    // Toggle filter off if clicking the same status
    if (status === statusFilter) {
      setStatusFilter("")
      fetchInvoices() // Reset to all invoices
      return
    }
    
    setStatusFilter(status)
    
    try {
      setLoading(true)
      let data
      
      // If status is selected, use the API endpoint for filtering by status
      if (status) {
        // For backend API, we need to use uppercase status
        const backendStatus = status.toUpperCase()
        const response = await getInvoicesByStatus(backendStatus)
        data = Array.isArray(response) ? response : (response.data || [])
      } else {
        // If no status filter, get all invoices
        const response = await getInvoices()
        data = response.data || response
      }
      
      setInvoices(data)
      setFilteredInvoices(data)
    } catch (err) {
      setError("Failed to filter invoices")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePrompt = (id, invoiceNumber) => {
    setDeleteDialog({
      open: true,
      invoiceId: id,
      invoiceNumber: invoiceNumber
    })
  }

  const handleDeleteConfirm = async () => {
    console.log("INVOICE DELETE STARTED for:", deleteDialog.invoiceNumber);
    
    try {
      await deleteInvoice(deleteDialog.invoiceId);
      setInvoices(
        invoices.filter(invoice => invoice.id !== deleteDialog.invoiceId)
      );
      setError(null);
    } catch (err) {
      console.log("INVOICE DELETE FAILED:", err);
      handleDeleteError(err, 'Invoice', deleteDialog.invoiceNumber);
    } finally {
      setDeleteDialog({ open: false, invoiceId: "", invoiceNumber: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, invoiceId: "", invoiceNumber: "" })
  }

  const handleDownloadPdf = async (id, invoiceNumber) => {
    try {
      const pdfBlob = await generateInvoicePdf(id)
      downloadPdf(pdfBlob, `Invoice-${invoiceNumber}.pdf`)
    } catch (err) {
      setError("Failed to generate PDF")
      console.error(err)
    }
  }

  if (loading)
    return <div className="flex justify-center p-8">Loading invoices...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Invoices</h1>
        <div className="flex gap-2">
          <Link
            to="/sales/orders"
            className="btn bg-blue-100 text-blue-800 px-3 py-2 rounded-md"
          >
            Orders
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-gray-700 mr-2 flex items-center">
            <Filter size={18} className="mr-1" /> Filter:
          </span>
          {/* Only show lowercase status values to avoid duplicates */}
          {Object.entries(statusLabels)
            .filter(([status]) => !status.includes('_') && status === status.toLowerCase())
            .map(([status, label]) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-1 rounded-md ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No invoices found. Complete an order to generate invoices.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/sales/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/sales/orders/${invoice.orderId}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {invoice.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invoice.dueDate ? (
                      <>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                        {new Date(invoice.dueDate) < new Date() && invoice.status.toLowerCase() !== "paid" && (
                          <span className="ml-2 text-xs text-red-600 font-semibold">OVERDUE</span>
                        )}
                      </>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">
                      ${parseFloat(invoice.total || 0).toFixed(2)}
                    </div>
                    {(invoice.status.toLowerCase() === "partial" || invoice.status.toLowerCase() === "paid" || invoice.paymentDate) && (
                      <div className="text-xs text-gray-500">
                        {invoice.status.toLowerCase() === "paid" ? 'Paid on:' : 'Partial payment:'} 
                        {invoice.paymentDate ? 
                          ` ${new Date(invoice.paymentDate).toLocaleDateString()}` : 
                          ` $${parseFloat(invoice.amountPaid || 0).toFixed(2)}`
                        }
                        {invoice.paymentMethod && (
                          <span className="ml-1">via {invoice.paymentMethod.replace('_', ' ')}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[invoice.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[invoice.status] || invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/sales/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FileText size={18} />
                      </Link>
                      {(invoice.status !== "paid" && invoice.status !== "PAID") && (
                        <button
                          onClick={() => navigate(`/sales/invoices/${invoice.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="Record Payment"
                        >
                          <DollarSign size={18} />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDownloadPdf(invoice.id, invoice.invoiceNumber)
                        }
                        className="text-gray-600 hover:text-gray-900"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeletePrompt(invoice.id, invoice.invoiceNumber)
                        }
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Invoice"
        message={`Are you sure you want to delete Invoice ${deleteDialog.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />

      {/* Add the error notification component */}
      <ErrorNotification
        error={deleteError}
        onClose={hideError}
        showAsDialog={showAsDialog}
        title="Cannot Delete Invoice"
      />
    </div>
  )
}

export default InvoiceList
