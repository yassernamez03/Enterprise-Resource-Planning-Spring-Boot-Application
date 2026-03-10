// src/services/Sales/orderService.js
import { apiService } from "../apiInterceptor";

const BASE_URL = "/sales/orders";

// Helper transformations
const transformOrderResponse = (order) => {
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    clientId: order.client?.id || order.clientId,
    clientName: order.client?.name || order.clientName,
    status: order.status?.toLowerCase() || "pending",
    totalAmount: order.totalAmount || calculateTotal(order.items || []),
    subtotal: calculateSubtotal(order.items || []),
    createdAt: order.createdDate,
    updatedAt: order.lastModifiedDate || order.updatedDate,
    items: (order.items || []).map((item) => ({
      id: item.id,
      productId: item.product?.id || item.productId,
      productName: item.product?.name || item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal || item.unitPrice * item.quantity,
      description: item.description || "",
    })),
    quoteId: order.quote?.id,
    quoteNumber: order.quote?.quoteNumber,
    notes: order.notes || "",
  };
};

const transformOrderRequest = (data) => ({
  clientId: data.clientId,
  items: (data.items || []).map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    description: item.description || "",
  })),
  notes: data.notes || "",
  status: data.status,
  quoteId: data.quoteId,
});

const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
};

const calculateTotal = (items) => {
  return items.reduce(
    (sum, item) => sum + (item.subtotal || item.unitPrice * item.quantity),
    0
  );
};

// Service functions
export const getOrders = async (
  pagination = { page: 0, pageSize: 10 },
  filters = {}
) => {
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      size: pagination.pageSize,
      ...filters,
    });

    const response = await apiService.get(`${BASE_URL}?${params.toString()}`);

    let orders = [];
    let total = 0;

    if (response.content) {
      orders = response.content;
      total = response.totalElements;
    } else if (Array.isArray(response)) {
      orders = response;
      total = orders.length;
    } else if (response.data) {
      orders = response.data;
      total = response.total || orders.length;
    }

    return {
      data: orders.map(transformOrderResponse),
      total,
      page: response.number || pagination.page,
      pageSize: response.size || pagination.pageSize,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const getOrder = async (id) => {
  try {
    const order = await apiService.get(`${BASE_URL}/${id}`);
    return transformOrderResponse(order);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    throw error;
  }
};

export const getOrderByNumber = async (orderNumber) => {
  try {
    const order = await apiService.get(`${BASE_URL}/number/${orderNumber}`);
    return transformOrderResponse(order);
  } catch (error) {
    console.error(`Error fetching order by number ${orderNumber}:`, error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const request = transformOrderRequest(orderData);
    const response = await apiService.post(`${BASE_URL}/create`, request);
    return transformOrderResponse(response);
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const updateOrder = async (id, updateData) => {
  try {
    // Handle status-only updates differently
    if (updateData.status && Object.keys(updateData).length === 1) {
      const response = await apiService.put(
        `${BASE_URL}/${id}/status?status=${updateData.status}`
      );
      return transformOrderResponse(response);
    }

    // Normal update for other cases - use the correct endpoint
    const request = transformOrderRequest(updateData);
    const response = await apiService.put(`${BASE_URL}/update/${id}`, request);
    return transformOrderResponse(response);
  } catch (error) {
    console.error(`Error updating order ${id}:`, error);
    throw new Error(error.response?.data?.message || "Failed to update order");
  }
};

export const deleteOrder = async (id) => {
  try {
    await apiService.delete(`${BASE_URL}/delete/${id}`);
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw error;
  }
};

export const getOrdersByClient = async (clientId) => {
  try {
    const orders = await apiService.get(`${BASE_URL}/client/${clientId}`);
    return Array.isArray(orders) ? orders.map(transformOrderResponse) : [];
  } catch (error) {
    console.error(`Error fetching orders for client ${clientId}:`, error);
    throw error;
  }
};

export const getOrdersByStatus = async (status) => {
  try {
    const orders = await apiService.get(`${BASE_URL}/status/${status}`);
    return Array.isArray(orders) ? orders.map(transformOrderResponse) : [];
  } catch (error) {
    console.error(`Error fetching orders with status ${status}:`, error);
    throw error;
  }
};

export const getOrdersByDateRange = async (startDate, endDate) => {
  try {
    const orders = await apiService.get(
      `${BASE_URL}/date-range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    return Array.isArray(orders) ? orders.map(transformOrderResponse) : [];
  } catch (error) {
    console.error(`Error fetching orders by date range:`, error);
    throw error;
  }
};

export const createInvoiceFromOrder = async (orderId) => {
  try {
    const response = await apiService.post(
      `${BASE_URL}/${orderId}/create-invoice`
    );
    return {
      invoiceId: response.id,
      invoiceNumber: response.invoiceNumber,
      success: true,
    };
  } catch (error) {
    console.error(`Error creating invoice for order ${orderId}:`, error);
    throw error;
  }
};

export const searchOrders = async (query) => {
  try {
    const orders = await apiService.get(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}`
    );
    return Array.isArray(orders) ? orders.map(transformOrderResponse) : [];
  } catch (error) {
    console.error(`Error searching orders:`, error);
    throw error;
  }
};

// Export as service object
const orderService = {
  getOrders,
  getOrder,
  getOrderByNumber,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrdersByClient,
  getOrdersByStatus,
  getOrdersByDateRange,
  createInvoiceFromOrder,
  searchOrders,
};

export default orderService;
