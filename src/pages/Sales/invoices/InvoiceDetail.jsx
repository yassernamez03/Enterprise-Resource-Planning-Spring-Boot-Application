import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { getInvoice } from "../../../services/Sales/invoiceService"
import { generateInvoicePdf, downloadPdf } from "../../../services/Sales/pdfService"
import { ArrowLeft, DollarSign, Download, MailOpen } from "lucide-react"

const statusLabels = {
  pending: "Pending",
  partial: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue"
}

const statusColors = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  partial: { bg: "bg-blue-100", text: "text-blue-800" },
  paid: { bg: "bg-green-100", text: "text-green-800" },
  overdue: { bg: "bg-red-100", text: "text-red-800" }
}

const InvoiceDetail = () => {
  const { id } = useParams()

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchInvoice(id)
    }
  }, [id])

  const fetchInvoice = async invoiceId => {
    try {
      setLoading(true)
      const data = await getInvoice(invoiceId)
      setInvoice(data)
    } catch (err) {
      setError("Failed to fetch invoice details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!invoice || !id) return

    try {
      const pdfBlob = await generateInvoicePdf(id)
      downloadPdf(pdfBlob, `Invoice-${invoice.invoiceNumber}.pdf`)
    } catch (err) {
      setError("Failed to generate PDF")
      console.error(err)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-8">Loading invoice details...</div>
    )
  if (error) return <div className="text-red-500 p-4">{error}</div>
  if (!invoice) return <div className="text-red-500 p-4">Invoice not found</div>

  const canRecordPayment = invoice.status !== "paid"
  const isPastDue =
    new Date(invoice.dueDate) < new Date() && invoice.status !== "paid"

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
            </h1>
            <span
              className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[invoice.status].bg
              } ${statusColors[invoice.status].text}`}
            >
              {statusLabels[invoice.status]}
            </span>
          </div>
          <p className="text-gray-600">
            Created on {new Date(invoice.createdAt).toLocaleDateString()} | Due
            on {new Date(invoice.dueDate).toLocaleDateString()}
            {isPastDue && <span className="text-red-600 ml-2">OVERDUE</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {canRecordPayment && (
            <Link
              to={`/sales/invoices/${invoice.id}/payment`}
              className="btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md flex items-center"
            >
              <DollarSign size={18} className="mr-1" />
              Record Payment
            </Link>
          )}

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
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-medium">${invoice.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid:</span>
              <span className="font-medium">
                ${invoice.amountPaid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due:</span>
              <span className="font-medium text-lg text-red-600">
                ${invoice.amountDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">
            Related Order
          </h3>
          <Link
            to={`/sales/orders/${invoice.orderId}`}
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
              {invoice.items.map(item => (
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
                  ${invoice.subtotal.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Discount ({invoice.discount}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  -${((invoice.subtotal * invoice.discount) / 100).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-6 py-3 text-right font-medium">
                  Tax ({invoice.tax}%)
                </td>
                <td className="px-6 py-3 text-right font-medium">
                  $
                  {(
                    ((invoice.subtotal -
                      (invoice.subtotal * invoice.discount) / 100) *
                      invoice.tax) /
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
                  ${invoice.total.toFixed(2)}
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
        {invoice.payments.length === 0 ? (
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
                {invoice.payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{payment.notes}</td>
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
  )
}

export default InvoiceDetail
