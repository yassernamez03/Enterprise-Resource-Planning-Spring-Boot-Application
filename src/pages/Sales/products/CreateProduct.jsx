import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ProductForm from "./components/ProductForm"
import { useAppContext } from "../../../context/Sales/AppContext"
import { productService } from "../../../services/Sales/productService";

const CreateProduct = () => {
  const navigate = useNavigate()
  const { showNotification } = useAppContext()

  const [loading, setLoading] = useState(false)

  const handleSubmit = async data => {
    try {
      setLoading(true)

      console.log("Creating product with data:", data);
      
      // In a real app, call the create API
      const newProduct = await productService.createProduct(data);
      console.log("New product created:", newProduct);
      // navigate(`sales/products/${newProduct.id}`);

      // For development, just wait a bit then redirect
      setTimeout(() => {
        showNotification("Product created successfully", "success")
        navigate("/sales/products")
      }, 500)
    } catch (error) {
      console.error("Error creating product:", error)
      showNotification("Failed to create product", "error")
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate("/sales/products")
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
        <h1 className="text-2xl font-bold text-gray-800">Create New Product</h1>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <p className="text-gray-600">
          Enter the product details to add a new item to your catalog.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default CreateProduct
