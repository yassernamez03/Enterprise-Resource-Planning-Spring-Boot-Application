import { quotes } from "./mockData"

import { orders } from "./mockData"

let mockQuotes = [...quotes]
let mockOrders = [...orders]

export const getQuotes = async () => {
  return Promise.resolve(mockQuotes)
}

export const getQuote = async id => {
  const quote = mockQuotes.find(q => q.id === id)
  if (!quote) {
    throw new Error("Quote not found")
  }
  return Promise.resolve(quote)
}

export const createQuote = async quote => {
  const newQuote = {
    ...quote,
    id: Math.random()
      .toString(36)
      .substr(2, 9)
  }
  mockQuotes.push(newQuote)
  return Promise.resolve(newQuote)
}

export const updateQuote = async (id, quote) => {
  const index = mockQuotes.findIndex(q => q.id === id)
  if (index === -1) {
    throw new Error("Quote not found")
  }
  mockQuotes[index] = { ...mockQuotes[index], ...quote }
  return Promise.resolve(mockQuotes[index])
}

export const deleteQuote = async id => {
  mockQuotes = mockQuotes.filter(q => q.id !== id)
  return Promise.resolve()
}

export const convertQuoteToOrder = async id => {
  // Find the quote
  const quote = mockQuotes.find(q => q.id === id)
  if (!quote) {
    throw new Error("Quote not found")
  }

  // Check if the quote can be converted
  if (quote.status !== "accepted") {
    throw new Error("Only accepted quotes can be converted to orders")
  }

  // Generate a new order ID and order number
  const orderId = Math.random()
    .toString(36)
    .substr(2, 9)
  const orderNumber = `ORD-${Date.now()
    .toString()
    .substr(-6)}`

  // Create a new order from the quote data
  const newOrder = {
    id: orderId,
    orderNumber,
    clientName: quote.clientName,
    status: "pending",
    items: [...quote.items], // Copy all items from the quote
    subtotal: quote.subtotal,
    discount: quote.discount,
    tax: quote.tax,
    total: quote.total,
    notes: quote.notes,
    createdAt: new Date().toISOString(),
    quoteId: quote.id, // Reference to the original quote
    clientId: ""
  }

  // Add the new order to our mock orders
  mockOrders.push(newOrder)

  // Update the original quote to mark it as converted
  const quoteIndex = mockQuotes.findIndex(q => q.id === id)
  if (quoteIndex !== -1) {
    mockQuotes[quoteIndex] = {
      ...mockQuotes[quoteIndex],
      convertedToOrder: orderId
    }
  }

  // Return the new order ID
  return Promise.resolve({
    orderId,
    success: true
  })
}

export const searchQuotes = async query => {
  const filtered = mockQuotes.filter(
    q =>
      q.quoteNumber.toLowerCase().includes(query.toLowerCase()) ||
      q.clientName.toLowerCase().includes(query.toLowerCase())
  )
  return Promise.resolve(filtered)
}

export const filterQuotesByStatus = async status => {
  const filtered = mockQuotes.filter(q => q.status === status)
  return Promise.resolve(filtered)
}
