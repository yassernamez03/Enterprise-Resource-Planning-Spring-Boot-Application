import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getOrders, deleteOrder } from "../../../services/Sales/orderService"
import { generateOrderPdf, downloadPdf } from "../../../services/Sales/pdfService"
import {
  Search,
  Filter,
  PlusCircle,
  FileText,
  Edit,
  Trash2,
  Download,
  FileInput as FileInvoice
} from "lucide-react"
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog"

const statusLabels = {
  pending: "Pending",
  "in-process": "In Process",
  completed: "Completed",
  cancelled: "Cancelled"
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  "in-process": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
}

const OrderList = () => {
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    orderId: "",
    orderNumber: ""
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await getOrders()
      setOrders(data)
      setFilteredOrders(data)
    } catch (err) {
      setError("Failed to fetch orders")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    if (searchTerm) {
      filtered = filtered.filter(
        order =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const handleSearch = event => {
    setSearchTerm(event.target.value)
  }

  const handleStatusFilter = status => {
    setStatusFilter(status === statusFilter ? "" : status)
  }

  const handleDeletePrompt = order => {
    setDeleteDialog({
      open: true,
      orderId: order.id,
      orderNumber: order.orderNumber
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteOrder(deleteDialog.orderId)
      setOrders(orders.filter(order => order.id !== deleteDialog.orderId))
    } catch (err) {
      setError("Failed to delete order")
      console.error(err)
    } finally {
      setDeleteDialog({ open: false, orderId: "", orderNumber: "" })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, orderId: "", orderNumber: "" })
  }

  const handleDownloadPdf = async (id, orderNumber) => {
    try {
      const pdfBlob = await generateOrderPdf(id)
      downloadPdf(pdfBlob, `Order-${orderNumber}.pdf`)
    } catch (err) {
      setError("Failed to generate PDF")
      console.error(err)
    }
  }

  if (loading)
    return <div className="flex justify-center p-8">Loading orders...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
        <div className="flex gap-2">
          <Link
            to="/sales/quotes"
            className="btn bg-blue-100 text-blue-800 px-3 py-2 rounded-md"
          >
            Quotes
          </Link>
          <Link
            to="/sales/orders/new"
            className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <PlusCircle size={18} className="mr-2" />
            New Order
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search orders..."
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
          {Object.entries(statusLabels).map(([status, label]) => (
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

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No orders found. Create your first order!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
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
                  Total
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
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/sales/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status]
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/sales/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FileText size={18} />
                      </Link>
                      {order.status !== "completed" && (
                        <Link
                          to={`/sales/orders/${order.id}/edit`}
                          className="text-amber-600 hover:text-amber-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                      )}
                      <button
                        onClick={() =>
                          handleDownloadPdf(order.id, order.orderNumber)
                        }
                        className="text-green-600 hover:text-green-900"
                        title="Download PDF"
                      >
                        <Download size={18} />
                      </button>
                      {order.status === "completed" && (
                        <Link
                          to={`/sales/orders/${order.id}/invoice`}
                          className="text-purple-600 hover:text-purple-900"
                          title="Generate Invoice"
                        >
                          <FileInvoice size={18} />
                        </Link>
                      )}
                      {order.status !== "completed" &&
                        order.status !== "cancelled" && (
                          <button
                            onClick={() => handleDeletePrompt(order)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
        title="Delete Order"
        message={`Are you sure you want to delete order #${deleteDialog.orderNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  )
}

export default OrderList
