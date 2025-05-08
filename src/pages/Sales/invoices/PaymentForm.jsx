import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { getInvoice, recordPayment } from "../../../services/Sales/invoiceService"
import { ArrowLeft, DollarSign } from "lucide-react"

const schema = yup
  .object({
    amount: yup
      .number()
      .required("Amount is required")
      .positive("Amount must be positive")
      .typeError("Amount must be a number"),
    method: yup.string().required("Payment method is required"),
    date: yup.string().required("Payment date is required"),
    notes: yup.string()
  })
  .required()

const PaymentForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: 0,
      method: "credit-card",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    }
  })

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
      setValue("amount", data.amountDue)
    } catch (err) {
      setError("Failed to fetch invoice details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async data => {
    if (!invoice || !id) return

    try {
      setSubmitting(true)

      await recordPayment(id, {
        amount: data.amount,
        method: data.method,
        date: data.date,
        notes: data.notes || ""
      })

      navigate(`/invoices/${id}`)
    } catch (err) {
      setError("Failed to record payment")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="flex justify-center p-8">Loading invoice details...</div>
    )
  if (error) return <div className="text-red-500 p-4">{error}</div>
  if (!invoice) return <div className="text-red-500 p-4">Invoice not found</div>

  if (invoice.status === "paid") {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center mb-6">
          <Link
            to={`/sales/invoices/${invoice.id}`}
            className="text-gray-600 hover:text-gray-800 mr-2"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-800">
            Record Payment
          </h1>
        </div>

        <div className="bg-green-100 p-4 rounded-md text-green-800 mb-6">
          <p className="font-medium">This invoice has been fully paid.</p>
          <p>No additional payments can be recorded.</p>
        </div>

        <Link
          to={`/sales/invoices/${invoice.id}`}
          className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Back to Invoice
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center mb-6">
        <Link
          to={`/sales/invoices/${invoice.id}`}
          className="text-gray-600 hover:text-gray-800 mr-2"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-semibold text-gray-800">Record Payment</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Invoice Details
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice #:</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">{invoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">${invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">
                  ${invoice.amountPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-800 font-medium">Amount Due:</span>
                <span className="font-medium text-lg text-red-600">
                  ${invoice.amountDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            Payment Information
          </h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={invoice.amountDue}
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                        className={`w-full pl-8 pr-4 py-2 border rounded-md ${
                          errors.amount ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                    </div>
                  )}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <Controller
                  name="method"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full p-2 border rounded-md ${
                        errors.method ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="credit-card">Credit Card</option>
                      <option value="bank-transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="paypal">PayPal</option>
                      <option value="other">Other</option>
                    </select>
                  )}
                />
                {errors.method && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.method.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="date"
                      {...field}
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full p-2 border rounded-md ${
                        errors.date ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      placeholder="Add any relevant notes about this payment"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Link
                  to={`/sales/invoices/${invoice.id}`}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  disabled={submitting}
                >
                  <DollarSign size={18} className="mr-1" />
                  {submitting ? "Processing..." : "Record Payment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PaymentForm
