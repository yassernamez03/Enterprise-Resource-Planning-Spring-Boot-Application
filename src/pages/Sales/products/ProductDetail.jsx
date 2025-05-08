import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import {
  Edit,
  ArrowLeft,
  Trash2,
  Tag,
  Package,
  DollarSign,
  Truck,
  Clock,
  ShoppingCart
} from "lucide-react"
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog"
import { useAppContext } from "../../../context/Sales/AppContext"

// Mock product for development
const MOCK_PRODUCT = {
  id: 1,
  name: "Premium Widget",
  description:
    "High-quality widget with premium features. This widget includes advanced technology with durable construction. Perfect for both professional and personal use.",
  sku: "WDG-001",
  price: 49.99,
  cost: 19.99,
  categoryId: 1,
  category: { id: 1, name: "Electronics" },
  inStock: 150,
  minStock: 20,
  isActive: true,
  createdAt: "2023-02-15T08:30:00.000Z",
  updatedAt: "2023-05-20T14:45:00.000Z"
}

// Mock sales history
const MOCK_SALES_HISTORY = [
  {
    id: 1,
    date: "2023-05-15",
    type: "order",
    reference: "ORD-2001",
    quantity: 5,
    unitPrice: 49.99,
    client: "Acme Corporation"
  },
  {
    id: 2,
    date: "2023-04-20",
    type: "order",
    reference: "ORD-1845",
    quantity: 3,
    unitPrice: 49.99,
    client: "Globex Industries"
  },
  {
    id: 3,
    date: "2023-03-12",
    type: "order",
    reference: "ORD-1721",
    quantity: 10,
    unitPrice: 44.99,
    client: "Stark Industries"
  }
]

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showNotification } = useAppContext()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)

        // In a real app, use the API service
        // const data = await getProduct(Number(id));
        // setProduct(data);

        // Using mock data for development
        setTimeout(() => {
          setProduct(MOCK_PRODUCT)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching product:", error)
        showNotification("Failed to load product details", "error")
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  const handleBack = () => {
    navigate("/sales/products")
  }

  const handleEdit = () => {
    navigate(`/sales/products/${id}/edit`)
  }

  const handleDeletePrompt = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      // In a real app, call the delete API
      // await deleteProduct(Number(id));

      showNotification(
        `Product ${product?.name} deleted successfully`,
        "success"
      )
      navigate("/sales/products")
    } catch (error) {
      console.error("Error deleting product:", error)
      showNotification("Failed to delete product", "error")
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }

  const calculateMargin = () => {
    if (!product) return { amount: 0, percentage: 0 }

    const amount = product.price - product.cost
    const percentage = (amount / product.price) * 100

    return {
      amount,
      percentage
    }
  }

  const margin = calculateMargin()

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

        <div className="bg-white rounded-lg shadow-card p-6 mb-8">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-700">Product not found</h2>
        <button
          onClick={handleBack}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-2">
        <button
          onClick={handleBack}
          className="inline-flex items-center mr-3 text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
              product.isActive
                ? "bg-success-100 text-success-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {product.isActive ? "Active" : "Inactive"}
          </span>
          <span className="text-gray-600">
            SKU: {product.sku} • Category: {product.category.name}
          </span>
        </div>

        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Edit size={16} className="mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeletePrompt}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-error-600 hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Product Details
            </h2>

            <div className="mb-6">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-800 whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <DollarSign size={18} className="text-primary-600 mr-2" />
                  <p className="text-sm font-medium text-gray-700">Pricing</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Selling Price:</p>
                    <p className="text-gray-800 font-medium">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Cost:</p>
                    <p className="text-gray-800 font-medium">
                      ${product.cost.toFixed(2)}
                    </p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Margin:</p>
                      <p className="text-gray-800 font-medium">
                        ${margin.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-gray-600">Margin %:</p>
                      <p
                        className={`font-medium ${
                          margin.percentage < 30
                            ? "text-error-600"
                            : "text-success-600"
                        }`}
                      >
                        {margin.percentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Package size={18} className="text-primary-600 mr-2" />
                  <p className="text-sm font-medium text-gray-700">Inventory</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">In Stock:</p>
                    <p
                      className={`font-medium ${
                        product.inStock <= product.minStock
                          ? "text-error-600"
                          : "text-gray-800"
                      }`}
                    >
                      {product.inStock}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Min Stock:</p>
                    <p className="text-gray-800 font-medium">
                      {product.minStock}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Status:</p>
                    <p
                      className={`font-medium ${
                        product.inStock <= product.minStock
                          ? "text-error-600"
                          : "text-success-600"
                      }`}
                    >
                      {product.inStock <= product.minStock
                        ? "Low Stock"
                        : "In Stock"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock size={18} className="text-primary-600 mr-2" />
                  <p className="text-sm font-medium text-gray-700">
                    Timestamps
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Created:</p>
                    <p className="text-gray-800 font-medium">
                      {format(new Date(product.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Updated:</p>
                    <p className="text-gray-800 font-medium">
                      {format(new Date(product.updatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">
                Sales History
              </h2>
              <a
                href="#"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </a>
            </div>

            {MOCK_SALES_HISTORY.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No sales history found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {MOCK_SALES_HISTORY.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {format(new Date(sale.date), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-600 font-medium">
                          {sale.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {sale.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          ${sale.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                          ${(sale.quantity * sale.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-card p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Sales Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-gray-600">Total Orders</p>
                <p className="font-medium">18</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Units Sold</p>
                <p className="font-medium">154</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Returns</p>
                <p className="font-medium">2</p>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <p className="text-gray-800 font-medium">Total Revenue</p>
                  <p className="font-bold text-primary-600">$7,678.46</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-2">
              <a
                href="#"
                className="block w-full text-left px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
              >
                <div className="flex items-center">
                  <Tag size={18} className="mr-2" />
                  <span>Update Price</span>
                </div>
              </a>
              <a
                href="#"
                className="block w-full text-left px-4 py-2 bg-secondary-50 text-secondary-700 rounded-md hover:bg-secondary-100 transition-colors"
              >
                <div className="flex items-center">
                  <Truck size={18} className="mr-2" />
                  <span>Manage Inventory</span>
                </div>
              </a>
              <a
                href="#"
                className="block w-full text-left px-4 py-2 bg-success-50 text-success-700 rounded-md hover:bg-success-100 transition-colors"
              >
                <div className="flex items-center">
                  <ShoppingCart size={18} className="mr-2" />
                  <span>Add to Order</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Product"
        message={`Are you sure you want to delete ${product.name}? This action cannot be undone and may affect existing quotes and orders.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  )
}

export default ProductDetail
