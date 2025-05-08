import { get, getPaginated, post, put, del } from "./api"

const BASE_URL = "/sales/products"
const CATEGORY_URL = "/sales/product-categories"

export const getProducts = async (pagination, filters) => {
  const response = await getPaginated(BASE_URL, pagination, filters)
  return response.data
}

export const getProduct = async id => {
  const response = await get(`${BASE_URL}/${id}`)
  return response.data.data
}

export const createProduct = async productData => {
  const response = await post(BASE_URL, productData)
  return response.data.data
}

export const updateProduct = async (id, productData) => {
  const response = await put(`${BASE_URL}/${id}`, productData)
  return response.data.data
}

export const deleteProduct = async id => {
  await del(`${BASE_URL}/${id}`)
}

export const getProductCategories = async () => {
  const response = await get(CATEGORY_URL)
  return response.data.data
}

export const createProductCategory = async category => {
  const response = await post(CATEGORY_URL, category)
  return response.data.data
}

export const updateProductCategory = async (id, category) => {
  const response = await put(`${CATEGORY_URL}/${id}`, category)
  return response.data.data
}

export const deleteProductCategory = async id => {
  await del(`${CATEGORY_URL}/${id}`)
}
