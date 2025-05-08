import { orders } from "./mockData"

let mockOrders = [...orders]

export const getOrders = async () => {
  return Promise.resolve(mockOrders)
}

export const getOrder = async id => {
  const order = mockOrders.find(o => o.id === id)
  if (!order) {
    throw new Error("Order not found")
  }
  return Promise.resolve(order)
}

export const createOrder = async order => {
  const newOrder = {
    ...order,
    id: Math.random()
      .toString(36)
      .substr(2, 9)
  }
  mockOrders.push(newOrder)
  return Promise.resolve(newOrder)
}

export const updateOrder = async (id, order) => {
  const index = mockOrders.findIndex(o => o.id === id)
  if (index === -1) {
    throw new Error("Order not found")
  }
  mockOrders[index] = { ...mockOrders[index], ...order }
  return Promise.resolve(mockOrders[index])
}

export const deleteOrder = async id => {
  mockOrders = mockOrders.filter(o => o.id !== id)
  return Promise.resolve()
}

export const generateInvoice = async id => {
  const order = mockOrders.find(o => o.id === id)
  if (!order) {
    throw new Error("Order not found")
  }
  return Promise.resolve({
    invoiceId: Math.random()
      .toString(36)
      .substr(2, 9),
    success: true
  })
}

export const searchOrders = async query => {
  const filtered = mockOrders.filter(
    o =>
      o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
      o.clientName.toLowerCase().includes(query.toLowerCase())
  )
  return Promise.resolve(filtered)
}

export const filterOrdersByStatus = async status => {
  const filtered = mockOrders.filter(o => o.status === status)
  return Promise.resolve(filtered)
}
