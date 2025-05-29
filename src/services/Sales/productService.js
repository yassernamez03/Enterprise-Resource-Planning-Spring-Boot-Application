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
        sku: product.sku || "N/A",
        inStock: product.stock || 0,
        minStock: product.minStock || 0,
        isActive: product.active, // Map active to isActive
        category: {
          name: product.category || "Uncategorized" // Handle category as string or object
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
        sku: product.sku || "N/A",
        inStock: product.stock || 0,
        minStock: product.minStock || 0,
        isActive: product.active,
        category: {
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
      sku: productData.sku,
      stock: productData.inStock,
      minStock: productData.minStock,
      active: productData.active,
      category: productData.category?.name || productData.category
    };
    
    return apiService.post(`${BASE_URL}/create`, backendProduct);
  },

  updateProduct: async (id, productData) => {
    // Transform frontend data to match backend expected properties
    const backendProduct = {
      name: productData.name,
      description: productData.description,
      unitPrice: productData.price,
      sku: productData.sku,
      stock: productData.inStock,
      minStock: productData.minStock,
      active: productData.isActive,
      category: productData.category?.name || productData.category
    };
    
    return apiService.put(`${BASE_URL}/update/${id}`, backendProduct);
  },

  deleteProduct: async (id) => {
    return apiService.delete(`${BASE_URL}/delete/${id}`);
  },

  checkProductHasOrders: async (productId) => {
    const response = await apiService.get(`/api/sales/orders?productId=${productId}`);
    return response.length > 0; // or adjust based on your API response
  },
  
  searchProducts: async (query) => {
    return apiService.get(`${BASE_URL}/search?query=${encodeURIComponent(query)}`);
  }
};

export { productService };