import { get, getPaginated, post, put, del } from "./api"

const BASE_URL = "/sales/clients"

export const getClients = async (pagination, filters) => {
  const response = await getPaginated(BASE_URL, pagination, filters)
  return response.data
}

export const getClient = async id => {
  const response = await get(`${BASE_URL}/${id}`)
  return response.data.data
}

export const createClient = async clientData => {
  const response = await post(BASE_URL, clientData)
  return response.data.data
}

export const updateClient = async (id, clientData) => {
  const response = await put(`${BASE_URL}/${id}`, clientData)
  return response.data.data
}

export const deleteClient = async id => {
  await del(`${BASE_URL}/${id}`)
}

export const searchClients = async query => {
  const response = await get(`${BASE_URL}/search`, { query })
  return response.data.data
}
