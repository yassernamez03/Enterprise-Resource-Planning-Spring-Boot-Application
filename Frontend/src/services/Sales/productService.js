// src/services/Sales/productService.js
import { apiService } from "../apiInterceptor";

const BASE_URL = "/sales/products";

const productService = {
  getProducts: async (pagination, filters) => {
    const params = new URLSearchParams({
      page: pagination.page,
      size: pagination.pageSize,
      ...filters
    });
    
    try { 
      const response = await apiService.get(`${BASE_URL}?${params.toString()}`);
      // Handle different response structures (page object or array)
      let products = [];
      let total = 0;
      
      if (response.content) {
        // Spring Data pagination response
        products = response.content;
        total = response.totalElements;
      } else if (Array.isArray(response)) {
        // Direct array response
        products = response;
        total = response.length;
      } else if (response.data) {
        // Generic wrapped response
        products = response.data;
        total = response.total || products.length;
      }
      
      // Transform backend response to match frontend property names
      const transformedProducts = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.unitPrice, // Map unitPrice to price
        isActive: product.active, // Map active to isActive
        createdAt: product.createdDate, // Map createdDate to createdAt
        updatedAt: product.lastModifiedDate, // Map lastModifiedDate to updatedAt
        category: {
          id: null, // Backend doesn't have categoryId
          name: product.category || "Uncategorized" // Handle category as string
        }
      }));
      
      return {
        data: transformedProducts,
        total: total,
        page: response.number || response.page || pagination.page,
        pageSize: response.size || response.pageSize || pagination.pageSize
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  getProduct: async (id) => {
    try {
      const product = await apiService.get(`${BASE_URL}/${id}`);
      
      // Transform backend response to match frontend property names
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.unitPrice,
        unitPrice: product.unitPrice, // Keep both for compatibility
        isActive: product.active,
        createdAt: product.createdDate,
        updatedAt: product.lastModifiedDate,
        category: {
          id: null,
          name: product.category || "Uncategorized"
        }
      };
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  createProduct: async (productData) => {
    // Transform frontend data to match backend expected properties
    const backendProduct = {
      name: productData.name,
      description: productData.description,
      unitPrice: productData.unitPrice,
      category: productData.category?.name || productData.category || null,
      active: productData.active ?? true
    };
    
    return apiService.post(`${BASE_URL}/create`, backendProduct);
  },

  updateProduct: async (id, productData) => {
    // Transform frontend data to match backend expected properties
    const backendProduct = {
      name: productData.name,
      description: productData.description,
      unitPrice: productData.unitPrice,
      category: productData.category?.name || productData.category || null,
      active: productData.active ?? true
    };
    
    return apiService.put(`${BASE_URL}/update/${id}`, backendProduct);
  },

  deleteProduct: async (id) => {
    return apiService.delete(`${BASE_URL}/delete/${id}`);
  },

  // New methods for real sales data
  getProductSalesHistory: async (productId, limit = 10) => {
    try {
      // Fetch orders that contain this product
      const ordersResponse = await apiService.get(`/sales/orders?productId=${productId}&size=${limit}`);
      const orders = ordersResponse.content || ordersResponse.data || ordersResponse || [];
      
      // Transform orders to sales history format
      const salesHistory = [];
      
      orders.forEach(order => {
        // Find items in the order that match our product
        const productItems = (order.items || []).filter(item => 
          item.productId?.toString() === productId.toString()
        );
        
        productItems.forEach(item => {
          salesHistory.push({
            id: `${order.id}-${item.id}`,
            date: order.createdAt,
            type: "order",
            reference: order.orderNumber,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            client: order.clientName || "Unknown Client"
          });
        });
      });

      // Sort by date (most recent first)
      return salesHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.warn("Error fetching product sales history:", error);
      return [];
    }
  },

  getProductSalesSummary: async (productId) => {
    try {
      // Try to get product-specific sales summary from backend
      const response = await apiService.get(`/sales/reports/product-sales/${productId}`);
      return {
        totalOrders: response.totalOrders || 0,
        unitsSold: response.unitsSold || 0,
        totalRevenue: response.totalRevenue || 0,
        returns: response.returns || 0
      };
    } catch (error) {
      console.warn("Product sales summary endpoint not available, calculating from orders");
      
      try {
        // Fallback: calculate from orders data
        const ordersResponse = await apiService.get(`/sales/orders?productId=${productId}`);
        const orders = ordersResponse.content || ordersResponse.data || ordersResponse || [];
        
        let totalOrders = 0;
        let unitsSold = 0;
        let totalRevenue = 0;
        
        orders.forEach(order => {
          const productItems = (order.items || []).filter(item => 
            item.productId?.toString() === productId.toString()
          );
          
          if (productItems.length > 0) {
            totalOrders++;
            productItems.forEach(item => {
              unitsSold += item.quantity || 0;
              totalRevenue += (item.quantity || 0) * (item.unitPrice || 0);
            });
          }
        });
        
        return {
          totalOrders,
          unitsSold,
          totalRevenue,
          returns: 0 // Not available from orders data
        };
      } catch (fallbackError) {
        console.warn("Error calculating sales summary from orders:", fallbackError);
        return {
          totalOrders: 0,
          unitsSold: 0,
          totalRevenue: 0,
          returns: 0
        };
      }
    }
  },

  checkProductHasOrders: async (productId) => {
    try {
      const response = await apiService.get(`/sales/orders?productId=${productId}&size=1`);
      const orders = response.content || response.data || response || [];
      return orders.length > 0;
    } catch (error) {
      console.warn("Error checking product orders:", error);
      return false;
    }
  },
  
  searchProducts: async (query) => {
    return apiService.get(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
  }
};

export { productService };