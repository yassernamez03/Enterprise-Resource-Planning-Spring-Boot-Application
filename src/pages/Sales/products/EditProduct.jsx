import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ProductForm from "./components/ProductForm"
import { useAppContext } from "../../../context/Sales/AppContext"

// Mock product for development
const MOCK_PRODUCT = {
  id: 1,
  name: "Premium Widget",
  description: "High-quality widget with premium features",
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

const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showNotification } = useAppContext()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  const handleSubmit = async data => {
    if (!product) return

    try {
      setSaving(true)

      // In a real app, call the update API
      // await updateProduct(product.id, data);

      // For development, just wait a bit then redirect
      setTimeout(() => {
        showNotification("Product updated successfully", "success")
        navigate(`/sales/products/${product.id}`)
      }, 1000)
    } catch (error) {
      console.error("Error updating product:", error)
      showNotification("Failed to update product", "error")
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/sales/products/${product?.id || ""}`)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
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
          onClick={() => navigate("/sales/products")}
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
          onClick={handleCancel}
          className="inline-flex items-center mr-3 text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <p className="text-gray-600">
          Update the product's information and click Save to apply changes.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <ProductForm
          initialData={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </div>
    </div>
  )
}

export default EditProduct
