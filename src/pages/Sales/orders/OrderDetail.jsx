import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import {
  getOrder,
  updateOrder,
  createInvoiceFromOrder
} from "../../../services/Sales/orderService";
import { generateOrderPdf, downloadPdf } from "../../../services/Sales/pdfService";
import {
  ArrowLeft,
  ClipboardEdit,
  FileCheck,
  Download,
  FileInput as FileInvoice,
  Ban,
  AlertTriangle
} from "lucide-react";
// Add hashids import
import { decodeId, encodeId } from "../../../utils/hashids";

const statusLabels = {
  PENDING: "Pending",
  IN_PROCESS: "In Process",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  INVOICED: "Invoiced"
};

const statusColors = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
  IN_PROCESS: { bg: "bg-blue-100", text: "text-blue-800" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-800" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-800" },
  INVOICED: { bg: "bg-purple-100", text: "text-purple-800" }
};

const OrderDetail = () => {
  const { id: hashId } = useParams(); // Get the hashed ID from URL
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [actualId, setActualId] = useState(null); // Store the decoded integer ID
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info",
    onConfirm: () => {}
  });

  useEffect(() => {
    if (hashId) {
      // Decode the hash to get the actual integer ID
      const decodedId = decodeId(hashId);
      
      if (!decodedId) {
        setError("Invalid order ID");
        setLoading(false);
        return;
      }
      
      setActualId(decodedId);
      fetchOrder(decodedId); // Use the decoded integer ID for API call
    }
  }, [hashId]);

  const fetchOrder = async (orderId) => {
    try {
      setLoading(true);
      const data = await getOrder(orderId); // API uses integer ID
      setOrder(data);
    } catch (err) {
      setError("Failed to fetch order details: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateOrderValues = (order) => {
    if (!order) {
      return {
        subtotal: 0,
        discount: 0,
        tax: 0,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        subtotalAfterDiscount: 0
      };
    }

    const subtotal = order.subtotal || 
      (order.items || []).reduce((sum, item) => sum + ((item.subtotal || 0) || ((item.unitPrice || 0) * (item.quantity || 0))), 0);
    const discount = order.discount || 0;
    const tax = order.tax || 0;

    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * tax) / 100;
    const totalAmount = order.totalAmount || (subtotalAfterDiscount + taxAmount);

    return {
      subtotal,
      discount,
      tax,
      discountAmount,
      taxAmount,
      totalAmount,
      subtotalAfterDiscount
    };
  };

  const handleStatusChange = async (status) => {
    if (!order || !actualId) return;

    try {
      setStatusLoading(status);
      const updatedOrder = await updateOrder(actualId, { status }); // Use integer ID for API
      setOrder(updatedOrder);
    } catch (err) {
      setError("Failed to update order status: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setStatusLoading(null);
      setDialogOpen(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!order || !actualId) return;

    try {
      setLoading(true);
      const result = await createInvoiceFromOrder(actualId); // Use integer ID for API
      
      // Navigate to the new invoice using encoded ID
      navigate(`/sales/invoices/${encodeId(result.invoiceId)}`);
    } catch (err) {
      setError("Failed to generate invoice: " + (err.message || "Unknown error"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!order || !actualId) return;

    try {
      const pdfBlob = await generateOrderPdf(actualId); // Use integer ID for API
      downloadPdf(pdfBlob, `Order-${order.orderNumber || 'order'}.pdf`);
    } catch (err) {
      setError("Failed to generate PDF: " + (err.message || "Unknown error"));
      console.error(err);
    }
  };

  const openStatusChangeDialog = (newStatus) => {
    let title, message, type;
    
    if (newStatus === "CANCELLED") {
      title = "Cancel Order";
      message = `Are you sure you want to cancel order #${order?.orderNumber || ''}? This action cannot be undone.`;
      type = "danger";
    } else if (newStatus === "IN_PROCESS") {
      title = "Change Status to In Process";
      message = `Are you sure you want to change the status of order #${order?.orderNumber || ''} to In Process?`;
      type = "warning";
    } else if (newStatus === "COMPLETED") {
      title = "Complete Order";
      message = `Are you sure you want to mark order #${order?.orderNumber || ''} as Completed? This will allow invoice generation.`;
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
      message: `Are you sure you want to generate an invoice for order #${order?.orderNumber || ''}?`,
      confirmText: "Generate Invoice",
      cancelText: "Cancel",
      type: "info",
      onConfirm: handleGenerateInvoice
    });
    
    setDialogOpen(true);
  };

  if (loading) return (
    <div className="flex justify-center p-8">Loading order details...</div>
  );

  if (error) return (
    <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <p className="text-red-700">{error}</p>
      </div>
      <button
        onClick={() => setError(null)}
        className="mt-2 text-red-700 hover:text-red-900 underline text-sm"
      >
        Dismiss
      </button>
    </div>
  );

  if (!order) return <div className="text-red-500 p-4">Order not found</div>;

  const normalizedStatus = order.status?.toUpperCase() || "PENDING";
  const isEditable = !["COMPLETED", "CANCELLED", "INVOICED"].includes(normalizedStatus);
  const canGenerateInvoice = normalizedStatus === "COMPLETED";
  
  const nextStatus = () => {
    switch (normalizedStatus) {
      case "PENDING":
        return "IN_PROCESS";
      case "IN_PROCESS":
        return "COMPLETED";
      default:
        return normalizedStatus;
    }
  };

  const {
    subtotal,
    discount,
    tax,
    discountAmount,
    taxAmount,
    totalAmount
  } = calculateOrderValues(order);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
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
              Order #{order.orderNumber || 'N/A'}
            </h1>
            <span
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[normalizedStatus]?.bg || "bg-gray-200"
              } ${statusColors[normalizedStatus]?.text || "text-gray-800"}`}
            >
              {statusLabels[normalizedStatus] || normalizedStatus}
            </span>
          </div>
          <p className="text-gray-600">
            Created on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Unknown date'}
            {order.completedAt &&
              ` | Completed on ${new Date(order.completedAt).toLocaleDateString()}`}
          </p>
          {order.quoteNumber && (
            <p className="text-gray-600">
              Converted from quote #{order.quoteNumber}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {isEditable && (
            <Link
              to={`/sales/orders/${hashId}/edit`} // Use the original hash in the edit link
              className="btn bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md flex items-center"
            >
              <ClipboardEdit size={18} className="mr-1" />
              Edit
            </Link>
          )}

          {isEditable && normalizedStatus === "PENDING" && (
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

          {isEditable && normalizedStatus === "IN_PROCESS" && (
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
              onClick={() => openStatusChangeDialog("CANCELLED")}
              className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={!!statusLoading}
            >
              <Ban size={18} className="mr-1" />
              {statusLoading === "CANCELLED" ? "Cancelling..." : "Cancel Order"}
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
          <p className="font-medium text-gray-800">{order.clientName || 'No client specified'}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Total Amount
          </h3>
          <p className="font-medium text-gray-800 text-2xl">
            ${totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Order Details
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>${taxAmount.toFixed(2)}</span>
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
              {(order.items || []).map(item => {
                const itemSubtotal = item.subtotal || (item.unitPrice || 0) * (item.quantity || 0);
                const itemDiscount = item.discount || 0;
                const itemTax = item.tax || 0;
                const itemDiscountAmount = (itemSubtotal * itemDiscount) / 100;
                const itemTaxAmount = ((itemSubtotal - itemDiscountAmount) * itemTax) / 100;
                const itemTotal = itemSubtotal - itemDiscountAmount + itemTaxAmount;

                return (
                  <tr key={item.id || Math.random().toString(36).substr(2, 9)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {item.productName || 'No product name'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {item.quantity || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      ${(item.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {itemDiscount}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {itemTax}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      ${itemTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Subtotal
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  ${subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Discount ({discount}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  -${discountAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Tax ({tax}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  ${taxAmount.toFixed(2)}
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
                  ${totalAmount.toFixed(2)}
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
  );
};

export default OrderDetail;