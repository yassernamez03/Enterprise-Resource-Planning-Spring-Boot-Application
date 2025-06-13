import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getInvoice,
  recordPayment,
} from "../../../services/Sales/invoiceService";
import {
  generateInvoicePdf,
  downloadPdf,
} from "../../../services/Sales/pdfService";
import { ArrowLeft, DollarSign, Download, MailOpen } from "lucide-react";
// Add hashids import
import { decodeId, encodeId } from "../../../utils/hashids";

// Map backend status enum values to frontend display values
const statusLabels = {
  pending: "Pending",
  partial: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

// These are the normalized lowercase status values we use in the frontend
const statusColors = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  partial: { bg: "bg-blue-100", text: "text-blue-800" },
  paid: { bg: "bg-green-100", text: "text-green-800" },
  overdue: { bg: "bg-red-100", text: "text-red-800" },
};

const InvoiceDetail = () => {
  const { id: hashId } = useParams(); // Get the hashed ID from URL
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actualId, setActualId] = useState(null); // Store the decoded integer ID

  useEffect(() => {
    if (hashId) {
      // Decode the hash to get the actual integer ID
      const decodedId = decodeId(hashId);

      if (!decodedId) {
        setError("Invalid invoice ID");
        setLoading(false);
        return;
      }

      setActualId(decodedId);
      fetchInvoice(decodedId); // Use the decoded integer ID for API call
    }
  }, [hashId]);

  const fetchInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const data = await getInvoice(invoiceId); // API uses integer ID
      setInvoice(data);
    } catch (err) {
      setError("Failed to fetch invoice details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice || !actualId) return;

    try {
      const pdfBlob = await generateInvoicePdf(actualId); // Use integer ID for API
      downloadPdf(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      setError("Failed to generate PDF");
      console.error(err);
    }
  };
  if (loading)
    return (
      <div className="flex justify-center p-8">Loading invoice details...</div>
    );
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!invoice)
    return <div className="text-red-500 p-4">Invoice not found</div>;

  // Determine payment status based on backend status
  const canRecordPayment = invoice.status !== "paid";
  const isPastDue =
    new Date(invoice.dueDate) < new Date() && invoice.status !== "paid";

  const handleRecordPayment = async () => {
    if (!paymentMethod || !actualId) return;

    try {
      setIsSubmitting(true);
      await recordPayment(actualId, paymentMethod); // Use integer ID for API
      // Refetch invoice to get updated status
      await fetchInvoice(actualId);
      setIsPaymentModalOpen(false);
    } catch (err) {
      setError("Failed to record payment");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure we use the correct status for the frontend display
  const displayStatus = invoice.status.toLowerCase();

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Link
              to="/sales/invoices"
              className="text-gray-600 hover:text-gray-800 mr-2"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">
              Invoice #{invoice.invoiceNumber}
            </h1>{" "}
            <span
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[displayStatus]?.bg || statusColors.pending.bg
              } ${
                statusColors[displayStatus]?.text || statusColors.pending.text
              }`}
            >
              {statusLabels[displayStatus] || invoice.status}
            </span>
          </div>
          <p className="text-gray-600">
            {" "}
            Created on {new Date(invoice.createdAt).toLocaleDateString()} | Due
            on{" "}
            {new Date(
              invoice.dueDate || invoice.paymentDueDate
            ).toLocaleDateString()}
            {isPastDue && <span className="text-red-600 ml-2">OVERDUE</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {" "}
          {canRecordPayment && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center"
            >
              <DollarSign size={18} className="mr-1" />
              Record Payment
            </button>
          )}{" "}
          <button
            onClick={handleDownloadPdf}
            className="btn bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md flex items-center"
          >
            <Download size={18} className="mr-1" />
            Download PDF
          </button>
          <button className="btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center">
            <MailOpen size={18} className="mr-1" />
            Email Invoice
          </button>
          {/* Payment Modal */}
          {isPaymentModalOpen && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/95 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Record Payment</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHECK">Check</option>
                    <option value="CASH">Cash</option>
                    <option value="PAYPAL">PayPal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="btn bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    className="btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Processing..." : "Record Payment"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Client
          </h3>
          <p className="font-medium text-gray-800">{invoice.clientName}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Payment Status
          </h3>{" "}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">
                ${parseFloat(invoice.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid:</span>
              <span className="font-medium">
                ${parseFloat(invoice.amountPaid || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due:</span>
              <span className="font-medium text-lg text-red-600">
                ${parseFloat(invoice.amountDue || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Related Order
          </h3>
          <Link
            to={`/sales/orders/${encodeId(invoice.orderId)}`}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            Order #{invoice.orderNumber}
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Invoice Items
        </h2>
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
              {(invoice.items || []).map((item, index) => (
                <tr key={item?.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {item?.productName || "Item"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item?.quantity || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    ${(item?.unitPrice || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item?.discount || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item?.tax || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    ${(item?.total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-3 text-right text-lg font-semibold"
                >
                  Total
                </td>
                <td className="px-6 py-3 text-right text-lg font-semibold">
                  ${(invoice.total || 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          Payment History
        </h2>
        {!invoice.payments || invoice.payments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(invoice.payments || []).map((payment, index) => (
                  <tr key={payment?.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment?.date
                        ? new Date(payment.date).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      ${(payment?.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {payment?.method || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {payment?.notes || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {invoice.notes && (
        <div>
          <h3 className="text-md font-medium text-gray-800 mb-2">Notes</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
