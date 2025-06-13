import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getQuote,
  updateQuote,
  convertQuoteToOrder,
  deleteQuote
} from "../../../services/Sales/quoteService";
import { generateQuotePdf, downloadPdf } from "../../../services/Sales/pdfService";
import { decodeId, encodeId } from "../../../utils/hashids";
import {
  ArrowLeft,
  ClipboardEdit,
  Send,
  FileCheck,
  FileX,
  Download,
  ShoppingCart,
  AlertTriangle
} from "lucide-react";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import ErrorNotification from '../../../components/ErrorNotification';
import { useErrorNotification } from '../../../hooks/useErrorNotification';

const statusLabels = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CONVERTED_TO_ORDER: "Converted to Order"
};

const statusColors = {
  DRAFT: { bg: "bg-gray-200", text: "text-gray-800" },
  SENT: { bg: "bg-blue-100", text: "text-blue-800" },
  ACCEPTED: { bg: "bg-green-100", text: "text-green-800" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800" },
  CONVERTED_TO_ORDER: { bg: "bg-purple-100", text: "text-purple-800" }
};

const QuoteDetail = () => {
  const { id: hashId } = useParams(); // Get the hashed ID from URL
  const navigate = useNavigate();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actualId, setActualId] = useState(null); // Store the decoded integer ID

  const { error: deleteError, showAsDialog, showError, hideError, handleDeleteError } = useErrorNotification();

  useEffect(() => {
    if (hashId) {
      // Decode the hash to get the actual integer ID
      const decodedId = decodeId(hashId);
      
      if (!decodedId) {
        setError("Invalid quote ID");
        setLoading(false);
        return;
      }
      
      setActualId(decodedId);
      fetchQuote(decodedId); // Use the decoded integer ID for API call
    }
  }, [hashId]);

  const fetchQuote = async (quoteId) => {
    try {
      setLoading(true);
      const data = await getQuote(quoteId); // API still expects integer ID
      setQuote(data);
    } catch (err) {
      setError(
        `Failed to fetch quote details: ${err.message || "Unknown error"}`
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!quote || !actualId) return;

    try {
      setStatusLoading(status);
      const updatedQuote = await updateQuote(actualId, { status }); // Use integer ID for API
      setQuote(updatedQuote);
    } catch (error) {
      console.error("Status update error:", error);
      setError(error.response?.data?.message || error.message || "Failed to update status");
    } finally {
      setStatusLoading(null);
    }
  };

  const handleConvertToOrder = async () => {
    if (!quote || !actualId) return;

    try {
      setIsConverting(true);
      const result = await convertQuoteToOrder(actualId); // Use integer ID for API

      if (!result || !result.orderId) {
        throw new Error("No order ID returned from conversion");
      }

      // Navigate to the new order using encoded ID
      navigate(`/sales/orders/${encodeId(result.orderId)}`);
    } catch (error) {
      console.error("Conversion error:", error);
      setError(error.response?.data?.message || error.message || "Failed to convert quote to order");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!actualId) return;

    try {
      await deleteQuote(actualId); // Use integer ID for API
      navigate('/sales/quotes');
    } catch (err) {
      handleDeleteError(err, 'Quote', quote?.quoteNumber || '');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!actualId || !quote) return;

    try {
      setLoading(true);
      const pdfBlob = await generateQuotePdf(actualId); // Use integer ID for API
      downloadPdf(pdfBlob, `Quote-${quote.quoteNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading quote...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!quote) return <div className="text-red-500 p-4">Quote not found</div>;

  // Handle status case sensitivity between backend enum and frontend display
  const normalizedStatus = quote.status?.toUpperCase() || "DRAFT";
  const isEditable = normalizedStatus === "DRAFT";
  const canBeConverted = normalizedStatus === "ACCEPTED";
  const isConverted = normalizedStatus === "CONVERTED_TO_ORDER";

  // Calculate discount amount
  const discountAmount = (quote.subtotal * quote.discount) / 100;
  
  // Calculate subtotal after discount
  const subtotalAfterDiscount = quote.subtotal - discountAmount;
  
  // Calculate tax amount
  const taxAmount = (subtotalAfterDiscount * quote.tax) / 100;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <ConfirmDialog
        isOpen={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={handleConvertToOrder}
        title="Convert to Order"
        message="Are you sure you want to convert this quote to an order? This action cannot be undone."
        confirmText={isConverting ? "Converting..." : "Convert"}
        cancelText="Cancel"
        type="warning"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Link
              to="/sales/quotes"
              className="text-gray-600 hover:text-gray-800 mr-2"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">
              Quote #{quote.quoteNumber}
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
            Created on {new Date(quote.createdAt).toLocaleDateString()} 
            {quote.validUntil && (
              <> | Valid until {new Date(quote.validUntil).toLocaleDateString()}</>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {isEditable && (
            <Link
              to={`/sales/quotes/${quote.id}/edit`}
              className="btn bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md flex items-center"
            >
              <ClipboardEdit size={18} className="mr-1" />
              Edit
            </Link>
          )}

          {normalizedStatus === "DRAFT" && (
            <button
              onClick={() => handleStatusChange("SENT")}
              className="btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={!!statusLoading}
            >
              <Send size={18} className="mr-1" />
              {statusLoading === "SENT" ? "Sending..." : "Mark as Sent"}
            </button>
          )}

          {normalizedStatus === "SENT" && !isConverted && (
            <>
              <button
                onClick={() => handleStatusChange("ACCEPTED")}
                className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center"
                disabled={!!statusLoading}
              >
                <FileCheck size={18} className="mr-1" />
                {statusLoading === "ACCEPTED"
                  ? "Updating..."
                  : "Mark as Accepted"}
              </button>

              <button
                onClick={() => handleStatusChange("REJECTED")}
                className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md flex items-center"
                disabled={!!statusLoading}
              >
                <FileX size={18} className="mr-1" />
                {statusLoading === "REJECTED"
                  ? "Updating..."
                  : "Mark as Rejected"}
              </button>
            </>
          )}

          {canBeConverted && !isConverted && (
            <button
              onClick={() => setShowConfirmation(true)}
              className="btn bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={isConverting}
            >
              <ShoppingCart size={18} className="mr-1" />
              Convert to Order
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="btn bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md flex items-center"
            disabled={isConverting || statusLoading}
          >
            <Download size={18} className="mr-1" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Client
          </h3>
          <p className="font-medium text-gray-800">{quote.clientName}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Total Amount
          </h3>
          <p className="font-medium text-gray-800 text-2xl">
            ${quote.total?.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Quote Details
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${quote.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount ({quote.discount}%):</span>
              <span>${discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({quote.tax}%):</span>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quote.items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {item.productName}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500">{item.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    ${item.unitPrice?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    ${item.subtotal?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right font-medium">
                  Subtotal
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  ${quote.subtotal?.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right font-medium">
                  Discount ({quote.discount}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  -${discountAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right font-medium">
                  Tax ({quote.tax}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  ${taxAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-3 text-right text-lg font-semibold"
                >
                  Total
                </td>
                <td className="px-6 py-3 text-right text-lg font-semibold">
                  ${quote.total?.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quote.notes && (
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">Notes</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-line">{quote.notes}</p>
            </div>
          </div>
        )}

        {quote.terms && (
          <div>
            <h3 className="text-md font-medium text-gray-800 mb-2">
              Terms & Conditions
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-line">{quote.terms}</p>
            </div>
          </div>
        )}
      </div>

      <ErrorNotification
        error={deleteError}
        onClose={hideError}
        showAsDialog={showAsDialog}
        title="Cannot Delete Quote"
      />
    </div>
  );
};

export default QuoteDetail;