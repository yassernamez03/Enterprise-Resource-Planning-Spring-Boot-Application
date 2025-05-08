import axios from "axios"

const API_URL = "/api"

export const generateQuotePdf = async id => {
  const response = await axios.get(`${API_URL}/quotes/${id}/pdf`, {
    responseType: "blob"
  })
  return response.data
}

export const generateOrderPdf = async id => {
  const response = await axios.get(`${API_URL}/orders/${id}/pdf`, {
    responseType: "blob"
  })
  return response.data
}

export const generateInvoicePdf = async id => {
  const response = await axios.get(`${API_URL}/invoices/${id}/pdf`, {
    responseType: "blob"
  })
  return response.data
}

export const downloadPdf = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
