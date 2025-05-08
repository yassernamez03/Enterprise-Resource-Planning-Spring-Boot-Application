import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  getQuote,
  updateQuote,
  convertQuoteToOrder
} from "../../../services/Sales/quoteService"
import { generateQuotePdf, downloadPdf } from "../../../services/Sales/pdfService"
import {
  ArrowLeft,
  ClipboardEdit,
  Send,
  FileCheck,
  FileX,
  Download,
  ShoppingCart,
  AlertTriangle
} from "lucide-react"

const statusLabels = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected"
}

const statusColors = {
  draft: { bg: "bg-gray-200", text: "text-gray-800" },
  sent: { bg: "bg-blue-100", text: "text-blue-800" },
  accepted: { bg: "bg-green-100", text: "text-green-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" }
}

const QuoteDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusLoading, setStatusLoading] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    if (id) {
      fetchQuote(id)
    }
  }, [id])

  const fetchQuote = async quoteId => {
    try {
      setLoading(true)
      const data = await getQuote(quoteId)
      setQuote(data)
    } catch (err) {
      setError(
        `Failed to fetch quote details: ${err.message || "Unknown error"}`
      )
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async status => {
    if (!quote || !id) return

    try {
      setStatusLoading(status)
      await updateQuote(id, { status })
      setQuote({ ...quote, status })
    } catch (err) {
      setError(
        `Failed to update quote status: ${err.message || "Unknown error"}`
      )
      console.error(err)
    } finally {
      setStatusLoading(null)
    }
  }

  const handleConvertToOrder = async () => {
    if (!quote || !id) return

    try {
      setIsConverting(true)
      const result = await convertQuoteToOrder(id)

      if (!result || !result.orderId) {
        throw new Error("No order ID returned from conversion")
      }

      // For testing, let's show a success message before navigation
      console.log(
        `Quote converted to order successfully. Order ID: ${result.orderId}`
      )

      // Navigate to the newly created order
      // Check if you have an orders route set up
      navigate(`/sales/orders/${result.orderId}`)
    } catch (err) {
      console.error("Error converting quote to order:", err)
      setError(
        `Failed to convert quote to order: ${err.message || "Unknown error"}`
      )
      setShowConfirmation(false)
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!quote || !id) return

    try {
      const pdfBlob = await generateQuotePdf(id)
      downloadPdf(pdfBlob, `Quote-${quote.quoteNumber}.pdf`)
    } catch (err) {
      setError(`Failed to generate PDF: ${err.message || "Unknown error"}`)
      console.error(err)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-8">Loading quote details...</div>
    )
  if (error)
    return (
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
    )
  if (!quote) return <div className="text-red-500 p-4">Quote not found</div>

  const isEditable = quote.status === "draft"
  const canBeConverted = quote.status === "accepted"

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Convert to Order
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to convert this quote to an order? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={isConverting}
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToOrder}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                disabled={isConverting}
              >
                {isConverting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Converting...
                  </>
                ) : (
                  <>Confirm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Link
              to="/quotes"
              className="text-gray-600 hover:text-gray-800 mr-2"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-semibold text-gray-800">
              Quote #{quote.quoteNumber}
            </h1>
            <span
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[quote.status].bg
              } ${statusColors[quote.status].text}`}
            >
              {statusLabels[quote.status]}
            </span>
          </div>
          <p className="text-gray-600">
            Created on {new Date(quote.createdAt).toLocaleDateString()} | Valid
            until {new Date(quote.validUntil).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {isEditable && (
            <Link
              to={`/quotes/${quote.id}/edit`}
              className="btn bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-md flex items-center"
            >
              <ClipboardEdit size={18} className="mr-1" />
              Edit
            </Link>
          )}

          {quote.status === "draft" && (
            <button
              onClick={() => handleStatusChange("sent")}
              className="btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center"
              disabled={!!statusLoading}
            >
              <Send size={18} className="mr-1" />
              {statusLoading === "sent" ? "Sending..." : "Mark as Sent"}
            </button>
          )}

          {quote.status === "sent" && (
            <>
              <button
                onClick={() => handleStatusChange("accepted")}
                className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center"
                disabled={!!statusLoading}
              >
                <FileCheck size={18} className="mr-1" />
                {statusLoading === "accepted"
                  ? "Updating..."
                  : "Mark as Accepted"}
              </button>

              <button
                onClick={() => handleStatusChange("rejected")}
                className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md flex items-center"
                disabled={!!statusLoading}
              >
                <FileX size={18} className="mr-1" />
                {statusLoading === "rejected"
                  ? "Updating..."
                  : "Mark as Rejected"}
              </button>
            </>
          )}

          {canBeConverted && (
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
          >
            <Download size={18} className="mr-1" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            ${quote.total.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Quote Details
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span>
                ${((quote.subtotal * quote.discount) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>
                $
                {(
                  ((quote.subtotal - (quote.subtotal * quote.discount) / 100) *
                    quote.tax) /
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
              {quote.items.map(item => (
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
                  ${quote.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Discount ({quote.discount}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  -${((quote.subtotal * quote.discount) / 100).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Tax ({quote.tax}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  $
                  {(
                    ((quote.subtotal -
                      (quote.subtotal * quote.discount) / 100) *
                      quote.tax) /
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
                  ${quote.total.toFixed(2)}
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
    </div>
  )
}

export default QuoteDetail
