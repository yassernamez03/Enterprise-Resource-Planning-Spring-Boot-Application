import { invoices } from "./mockData"

let mockInvoices = [...invoices]

export const getInvoices = async () => {
  return Promise.resolve(mockInvoices)
}

export const getInvoice = async id => {
  const invoice = mockInvoices.find(i => i.id === id)
  if (!invoice) {
    throw new Error("Invoice not found")
  }
  return Promise.resolve(invoice)
}

export const updateInvoice = async (id, invoice) => {
  const index = mockInvoices.findIndex(i => i.id === id)
  if (index === -1) {
    throw new Error("Invoice not found")
  }
  mockInvoices[index] = { ...mockInvoices[index], ...invoice }
  return Promise.resolve(mockInvoices[index])
}
export const deleteInvoice = async id => {
  mockInvoices = mockInvoices.filter(i => i.id !== id)
  return Promise.resolve()
}

export const recordPayment = async (id, payment) => {
  const index = mockInvoices.findIndex(i => i.id === id)
  if (index === -1) {
    throw new Error("Invoice not found")
  }

  const newPayment = {
    ...payment,
    id: Math.random()
      .toString(36)
      .substr(2, 9)
  }

  const invoice = mockInvoices[index]
  const updatedInvoice = {
    ...invoice,
    payments: [...invoice.payments, newPayment],
    amountPaid: invoice.amountPaid + payment.amount,
    amountDue: invoice.total - (invoice.amountPaid + payment.amount),
    status:
      invoice.total <= invoice.amountPaid + payment.amount ? "paid" : "partial"
  }

  mockInvoices[index] = updatedInvoice
  return Promise.resolve(updatedInvoice)
}

export const searchInvoices = async query => {
  const filtered = mockInvoices.filter(
    i =>
      i.invoiceNumber.toLowerCase().includes(query.toLowerCase()) ||
      i.clientName.toLowerCase().includes(query.toLowerCase()) ||
      i.orderNumber.toLowerCase().includes(query.toLowerCase())
  )
  return Promise.resolve(filtered)
}

export const filterInvoicesByStatus = async status => {
  const filtered = mockInvoices.filter(i => i.status === status)
  return Promise.resolve(filtered)
}

export const getOverdueInvoices = async () => {
  const now = new Date()
  const filtered = mockInvoices.filter(
    i => new Date(i.dueDate) < now && i.status !== "paid"
  )
  return Promise.resolve(filtered)
}
