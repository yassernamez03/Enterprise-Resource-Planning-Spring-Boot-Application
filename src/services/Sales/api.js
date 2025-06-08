import axios from "axios"

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:8443/api",
  headers: {
    "Content-Type": "application/json"
  },
  // Allow self-signed certificates for development
  httpsAgent: typeof window === 'undefined' ? new (require('https').Agent)({
    rejectUnauthorized: false
  }) : undefined
})

// Add request interceptor for auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("auth_token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

// Generic GET request
export const get = async (url, params, config) => {
  return api.get(url, { ...config, params })
}

// Generic GET request for paginated data
export const getPaginated = async (url, pagination, filters, config) => {
  const params = {
    page: pagination.page,
    size: pagination.pageSize,
    ...filters
  }
  return api.get(url, { ...config, params })
}

// Generic POST request
export const post = async (url, data, config) => {
  return api.post(url, data, config)
}

// Generic PUT request
export const put = async (url, data, config) => {
  return api.put(url, data, config)
}

// Generic DELETE request
export const del = async (url, config) => {
  return api.delete(url, config)
}

export default api
