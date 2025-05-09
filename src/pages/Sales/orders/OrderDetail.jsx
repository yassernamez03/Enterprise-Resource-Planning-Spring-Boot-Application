import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog"

import {
  getOrder,
  updateOrder,
  generateInvoice
} from "../../../services/Sales/orderService"
import { generateOrderPdf, downloadPdf } from "../../../services/Sales/pdfService"
import {
  ArrowLeft,
  ClipboardEdit,
  FileCheck,
  Download,
  FileInput as FileInvoice,
  Ban
} from "lucide-react"

const statusLabels = {
  pending: "Pending",
  "in-process": "In Process",
  completed: "Completed",
  cancelled: "Cancelled"
}

const statusColors = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  "in-process": { bg: "bg-blue-100", text: "text-blue-800" },
  completed: { bg: "bg-green-100", text: "text-green-800" },
  cancelled: { bg: "bg-red-100", text: "text-red-800" }
}

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusLoading, setStatusLoading] = useState(null)
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info",
    onConfirm: () => {}
  })

  useEffect(() => {
    if (id) {
      fetchOrder(id)
    }
  }, [id])

  const fetchOrder = async orderId => {
    try {
      setLoading(true)
      const data = await getOrder(orderId)
      setOrder(data)
    } catch (err) {
      setError("Failed to fetch order details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async status => {
    if (!order || !id) return

    try {
      setStatusLoading(status)
      await updateOrder(id, { status })
      setOrder({ ...order, status })
    } catch (err) {
      setError("Failed to update order status")
      console.error(err)
    } finally {
      setStatusLoading(null)
      setDialogOpen(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!order || !id) return

    try {
      setLoading(true)
      const result = await generateInvoice(id)
      navigate(`/sales/invoices/${result.invoiceId}`)
    } catch (err) {
      setError("Failed to generate invoice")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!order || !id) return

    try {
      const pdfBlob = await generateOrderPdf(id)
      downloadPdf(pdfBlob, `Order-${order.orderNumber}.pdf`)
    } catch (err) {
      setError("Failed to generate PDF")
      console.error(err)
    }
  }

  // Dialog opener functions for different actions
  const openStatusChangeDialog = (newStatus) => {
    let title, message, type;
    
    if (newStatus === "cancelled") {
      title = "Cancel Order";
      message = `Are you sure you want to cancel order #${order.orderNumber}? This action cannot be undone.`;
      type = "danger";
    } else if (newStatus === "in-process") {
      title = "Change Status to In Process";
      message = `Are you sure you want to change the status of order #${order.orderNumber} to In Process?`;
      type = "warning";
    } else if (newStatus === "completed") {
      title = "Complete Order";
      message = `Are you sure you want to mark order #${order.orderNumber} as Completed? This will allow invoice generation.`;
      type = "info";
    }
    
    setDialogConfig({
      title,
      message, 
      confirmText: "Confirm",
      cancelText: "Cancel",
      type,
      onConfirm: () => handleStatusChange(newStatus)
    });
    
    setDialogOpen(true);
  };

  const openInvoiceDialog = () => {
    setDialogConfig({
      title: "Generate Invoice",
      message: `Are you sure you want to generate an invoice for order #${order.orderNumber}?`,
      confirmText: "Generate Invoice",
      cancelText: "Cancel",
      type: "info",
      onConfirm: handleGenerateInvoice
    });
    
    setDialogOpen(true);
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">Loading order details...</div>
    )
  if (error) return <div className="text-red-500 p-4">{error}</div>
  if (!order) return <div className="text-red-500 p-4">Order not found</div>

  const isEditable =
    order.status !== "completed" && order.status !== "cancelled"
  const canGenerateInvoice = order.status === "completed"
  const nextStatus = () => {
    switch (order.status) {
      case "pending":
        return "in-process"
      case "in-process":
        return "completed"
      default:
        return order.status
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={dialogOpen} 
        onCancel={() => setDialogOpen(false)}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        type={dialogConfig.type}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Link
              to="/sales/orders"
              className="text-gray-600 hover:text-gray-800 mr-2"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">
              Order #{order.orderNumber}
            </h1>
            <span
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[order.status].bg
              } ${statusColors[order.status].text}`}
            >
              {statusLabels[order.status]}
            </span>
          </div>
          <p className="text-gray-600">
            Created on {new Date(order.createdAt).toLocaleDateString()}
            {order.completedAt &&
              ` | Completed on ${new Date(
                order.completedAt
              ).toLocaleDateString()}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {isEditable && (
            <Link
              to={`/sales/orders/${order.id}/edit`}
              className="btn bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md flex items-center"
            >
              <ClipboardEdit size={18} className="mr-1" />
              Edit
            </Link>
          )}

          {isEditable &&
            order.status !== "in-process" &&
            order.status !== "completed" && (
              <button
                onClick={() => openStatusChangeDialog(nextStatus())}
                className="btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center"
                disabled={!!statusLoading}
              >
                <FileCheck size={18} className="mr-1" />
                {statusLoading === nextStatus()
                  ? "Updating..."
                  : `Mark as ${statusLabels[nextStatus()]}`}
              </button>
            )}

          {isEditable && order.status === "in-process" && (
            <button
              onClick={() => openStatusChangeDialog(nextStatus())}
              className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={!!statusLoading}
            >
              <FileCheck size={18} className="mr-1" />
              {statusLoading === nextStatus()
                ? "Updating..."
                : `Mark as ${statusLabels[nextStatus()]}`}
            </button>
          )}

          {isEditable && (
            <button
              onClick={() => openStatusChangeDialog("cancelled")}
              className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={!!statusLoading}
            >
              <Ban size={18} className="mr-1" />
              {statusLoading === "cancelled" ? "Cancelling..." : "Cancel Order"}
            </button>
          )}

          {canGenerateInvoice && (
            <button
              onClick={openInvoiceDialog}
              className="btn bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={loading}
            >
              <FileInvoice size={18} className="mr-1" />
              Generate Invoice
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="btn bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md flex items-center"
          >
            <Download size={18} className="mr-1" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Client
          </h3>
          <p className="font-medium text-gray-800">{order.clientName}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Total Amount
          </h3>
          <p className="font-medium text-gray-800 text-2xl">
            ${order.total.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Order Details
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span>
                ${((order.subtotal * order.discount) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>
                $
                {(
                  ((order.subtotal - (order.subtotal * order.discount) / 100) *
                    order.tax) /
                  100
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {item.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.discount}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.tax}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Subtotal
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  ${order.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Discount ({order.discount}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  -${((order.subtotal * order.discount) / 100).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Tax ({order.tax}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  $
                  {(
                    ((order.subtotal -
                      (order.subtotal * order.discount) / 100) *
                      order.tax) /
                    100
                  ).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-3 text-right text-lg font-semibold"
                >
                  Total
                </td>
                <td className="px-6 py-3 text-right text-lg font-semibold">
                  ${order.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {order.notes && (
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Notes</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700 whitespace-pre-line">{order.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderDetail