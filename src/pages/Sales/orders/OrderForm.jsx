import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { createOrder, getOrder, updateOrder } from "../../../services/Sales/orderService"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"

// Mock API calls for clients and products - replace with actual API calls
const getClients = async () => {
  return new Promise(resolve => {
    resolve([
      {
        id: "1",
        name: "Acme Corp",
        email: "contact@acme.com",
        phone: "123-456-7890",
        address: "123 Main St",
        status: "active",
        createdAt: "2023-01-01"
      },
      {
        id: "2",
        name: "Wayne Industries",
        email: "info@wayne.com",
        phone: "987-654-3210",
        address: "456 Bat Ave",
        status: "active",
        createdAt: "2023-02-15"
      }
    ])
  })
}

const getProducts = async () => {
  return new Promise(resolve => {
    resolve([
      {
        id: "1",
        name: "Product A",
        description: "Description for Product A",
        sku: "SKU001",
        price: 29.99,
        cost: 15.0,
        quantity: 100,
        category: "Category 1",
        status: "active",
        createdAt: "2023-01-01"
      },
      {
        id: "2",
        name: "Product B",
        description: "Description for Product B",
        sku: "SKU002",
        price: 49.99,
        cost: 25.0,
        quantity: 50,
        category: "Category 2",
        status: "active",
        createdAt: "2023-02-01"
      }
    ])
  })
}

const schema = yup
  .object({
    clientId: yup.string().required("Client is required"),
    items: yup
      .array()
      .of(
        yup.object({
          productId: yup.string().required("Product is required"),
          quantity: yup
            .number()
            .required("Quantity is required")
            .min(1, "Quantity must be at least 1"),
          unitPrice: yup
            .number()
            .required("Unit price is required")
            .min(0, "Unit price must be positive"),
          discount: yup.number().min(0, "Discount must be positive"),
          tax: yup.number().min(0, "Tax must be positive")
        })
      )
      .min(1, "At least one item is required"),
    notes: yup.string()
  })
  .required()

const calculateItemTotal = item => {
  const quantity = item.quantity || 0
  const unitPrice = item.unitPrice || 0
  const discount = item.discount || 0
  const tax = item.tax || 0

  const subtotal = quantity * unitPrice
  const discountAmount = subtotal * (discount / 100)
  const taxAmount = (subtotal - discountAmount) * (tax / 100)

  return subtotal - discountAmount + taxAmount
}

const OrderForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [subtotal, setSubtotal] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: "",
      items: [
        { productId: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 }
      ],
      notes: ""
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  })

  const watchItems = watch("items")

  useEffect(() => {
    Promise.all([getClients(), getProducts()])
      .then(([clientsData, productsData]) => {
        setClients(clientsData)
        setProducts(productsData)
      })
      .catch(err => {
        setError("Failed to load data")
        console.error(err)
      })

    if (isEditMode && id) {
      setLoading(true)
      getOrder(id)
        .then(orderData => {
          reset({
            clientId: orderData.clientId,
            items: orderData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              tax: item.tax
            })),
            notes: orderData.notes
          })
          setDiscount(orderData.discount)
          setTax(orderData.tax)
        })
        .catch(err => {
          setError("Failed to load order")
          console.error(err)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [id, isEditMode, reset])

  useEffect(() => {
    // Calculate totals when items change
    let newSubtotal = 0

    watchItems?.forEach(item => {
      newSubtotal += calculateItemTotal(item)
    })

    setSubtotal(newSubtotal)

    const discountAmount = newSubtotal * (discount / 100)
    const taxAmount = (newSubtotal - discountAmount) * (tax / 100)
    setTotal(newSubtotal - discountAmount + taxAmount)
  }, [watchItems, discount, tax])

  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setValue(`items.${index}.unitPrice`, product.price)
    }
  }

  const addItem = () => {
    append({ productId: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 })
  }

  const removeItem = index => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const onSubmit = async data => {
    try {
      setLoading(true)

      const client = clients.find(c => c.id === data.clientId)

      const orderData = {
        clientId: data.clientId,
        clientName: client?.name || "",
        items: data.items.map(item => {
          const product = products.find(p => p.id === item.productId)
          return {
            ...item,

            // Temporary ID for new items
            id: Math.random()
              .toString(36)
              .substring(2, 9),

            productName: product?.name || "",
            total: calculateItemTotal(item)
          }
        }),
        subtotal,
        discount,
        tax,
        total,
        notes: data.notes || "",
        status: "pending",
        orderNumber: isEditMode
          ? ""
          : `ORD-${new Date()
              .getTime()
              .toString()
              .substring(0, 10)}`,
        createdAt: new Date().toISOString()
      }

      if (isEditMode && id) {
        await updateOrder(id, orderData)
      } else {
        await createOrder(orderData)
      }

      navigate("/sales/orders")
    } catch (err) {
      setError("Failed to save order")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEditMode)
    return <div className="flex justify-center p-8">Loading order data...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? "Edit Order" : "Create New Order"}
        </h1>
        <button
          onClick={() => navigate("/sales/orders")}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Orders
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className={`w-full p-2 border rounded-md ${
                    errors.clientId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.clientId.message}
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">Discount (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    className="w-16 p-1 border border-gray-300 rounded-md"
                  />
                </div>
                <span className="font-medium">
                  -${(subtotal * (discount / 100)).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">Tax (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tax}
                    onChange={e => setTax(Number(e.target.value))}
                    className="w-16 p-1 border border-gray-300 rounded-md"
                  />
                </div>
                <span className="font-medium">
                  $
                  {(
                    (subtotal - subtotal * (discount / 100)) *
                    (tax / 100)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="border-t pt-2 mt-2 flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-lg">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={18} className="mr-1" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Discount (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tax (%)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => {
                  const itemErrors = errors.items?.[index]
                  const item = watchItems?.[index]
                  const itemTotal = item ? calculateItemTotal(item) : 0

                  return (
                    <tr key={field.id}>
                      <td className="px-4 py-2">
                        <Controller
                          name={`items.${index}.productId`}
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              onChange={e => {
                                field.onChange(e)
                                handleProductSelect(index, e.target.value)
                              }}
                              className={`w-full p-2 border rounded-md ${
                                itemErrors?.productId
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Select a product</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        {itemErrors?.productId && (
                          <p className="mt-1 text-xs text-red-600">
                            {itemErrors.productId.message}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-2">
                        <Controller
                          name={`items.${index}.quantity`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="1"
                              {...field}
                              onChange={e =>
                                field.onChange(Number(e.target.value))
                              }
                              className={`w-full p-2 border rounded-md ${
                                itemErrors?.quantity
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          )}
                        />
                        {itemErrors?.quantity && (
                          <p className="mt-1 text-xs text-red-600">
                            {itemErrors.quantity.message}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-2">
                        <Controller
                          name={`items.${index}.unitPrice`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={e =>
                                field.onChange(Number(e.target.value))
                              }
                              className={`w-full p-2 border rounded-md ${
                                itemErrors?.unitPrice
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          )}
                        />
                        {itemErrors?.unitPrice && (
                          <p className="mt-1 text-xs text-red-600">
                            {itemErrors.unitPrice.message}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-2">
                        <Controller
                          name={`items.${index}.discount`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={e =>
                                field.onChange(Number(e.target.value))
                              }
                              className={`w-full p-2 border rounded-md ${
                                itemErrors?.discount
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          )}
                        />
                        {itemErrors?.discount && (
                          <p className="mt-1 text-xs text-red-600">
                            {itemErrors.discount.message}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-2">
                        <Controller
                          name={`items.${index}.tax`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={e =>
                                field.onChange(Number(e.target.value))
                              }
                              className={`w-full p-2 border rounded-md ${
                                itemErrors?.tax
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                          )}
                        />
                        {itemErrors?.tax && (
                          <p className="mt-1 text-xs text-red-600">
                            {itemErrors.tax.message}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-2 font-medium">
                        ${itemTotal.toFixed(2)}
                      </td>

                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={fields.length <= 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={4}
                placeholder="Add any relevant notes about this order"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/sales/orders")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            disabled={loading}
          >
            <Save size={18} className="mr-1" />
            {loading ? "Saving..." : "Save Order"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OrderForm
