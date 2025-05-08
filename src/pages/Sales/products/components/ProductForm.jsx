import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

const schema = yup
  .object({
    name: yup.string().required("Product name is required"),
    description: yup.string().required("Description is required"),
    sku: yup.string().required("SKU is required"),
    price: yup
      .number()
      .positive("Price must be positive")
      .required("Price is required"),
    cost: yup
      .number()
      .positive("Cost must be positive")
      .required("Cost is required"),
    categoryId: yup.number().required("Category is required"),
    inStock: yup
      .number()
      .min(0, "In stock must be non-negative")
      .required("In stock quantity is required"),
    minStock: yup
      .number()
      .min(0, "Minimum stock must be non-negative")
      .required("Minimum stock is required"),
    isActive: yup.boolean()
  })
  .required()

// Mock categories for development
const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "Electronics",
    description: "Electronic devices and accessories"
  },
  {
    id: 2,
    name: "Office Supplies",
    description: "Office essentials and supplies"
  },
  { id: 3, name: "Furniture", description: "Office and home furniture" },
  {
    id: 4,
    name: "Software",
    description: "Software licenses and subscriptions"
  }
]

const ProductForm = ({ initialData, onSubmit, onCancel, loading = false }) => {
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          sku: initialData.sku,
          price: initialData.price,
          cost: initialData.cost,
          categoryId: initialData.categoryId,
          inStock: initialData.inStock,
          minStock: initialData.minStock,
          isActive: initialData.isActive
        }
      : {
          isActive: true
        }
  })

  const price = watch("price") || 0
  const cost = watch("cost") || 0
  const margin = price - cost
  const marginPercentage = price > 0 ? (margin / price) * 100 : 0

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)

        // In a real app, use the API service
        // const categoriesData = await getProductCategories();
        // setCategories(categoriesData);

        // Using mock data for development
        setTimeout(() => {
          setCategories(MOCK_CATEGORIES)
          setCategoriesLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching product categories:", error)
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Product Name <span className="text-error-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.name ? "border-error-500" : ""
            }`}
            placeholder="Premium Widget"
            {...register("name")}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-xs text-error-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="sku"
            className="block text-sm font-medium text-gray-700"
          >
            SKU <span className="text-error-500">*</span>
          </label>
          <input
            id="sku"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.sku ? "border-error-500" : ""
            }`}
            placeholder="WDG-001"
            {...register("sku")}
            disabled={loading}
          />
          {errors.sku && (
            <p className="text-xs text-error-500">{errors.sku.message}</p>
          )}
        </div>

        <div className="space-y-1 md:col-span-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description <span className="text-error-500">*</span>
          </label>
          <textarea
            id="description"
            rows={3}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.description ? "border-error-500" : ""
            }`}
            placeholder="Detailed product description..."
            {...register("description")}
            disabled={loading}
          ></textarea>
          {errors.description && (
            <p className="text-xs text-error-500">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700"
          >
            Category <span className="text-error-500">*</span>
          </label>
          <select
            id="categoryId"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.categoryId ? "border-error-500" : ""
            }`}
            {...register("categoryId", { valueAsNumber: true })}
            disabled={loading || categoriesLoading}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categoriesLoading && (
            <p className="text-xs text-gray-500">Loading categories...</p>
          )}
          {errors.categoryId && (
            <p className="text-xs text-error-500">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="isActive"
            className="flex items-center text-sm font-medium text-gray-700"
          >
            <input
              id="isActive"
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 h-4 w-4 mr-2"
              {...register("isActive")}
              disabled={loading}
            />
            Active Product
          </label>
          <p className="text-xs text-gray-500">
            Inactive products won't appear in quotes or orders
          </p>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Selling Price <span className="text-error-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              id="price"
              type="number"
              step="0.01"
              className={`pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                errors.price ? "border-error-500" : ""
              }`}
              placeholder="0.00"
              {...register("price", { valueAsNumber: true })}
              disabled={loading}
            />
          </div>
          {errors.price && (
            <p className="text-xs text-error-500">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="cost"
            className="block text-sm font-medium text-gray-700"
          >
            Cost <span className="text-error-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              id="cost"
              type="number"
              step="0.01"
              className={`pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                errors.cost ? "border-error-500" : ""
              }`}
              placeholder="0.00"
              {...register("cost", { valueAsNumber: true })}
              disabled={loading}
            />
          </div>
          {errors.cost && (
            <p className="text-xs text-error-500">{errors.cost.message}</p>
          )}
        </div>

        <div className="space-y-1 md:col-span-2">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Margin Calculation
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Gross Margin</p>
                <p className="text-gray-800 font-medium">
                  ${margin.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Margin %</p>
                <p
                  className={`font-medium ${
                    marginPercentage < 30
                      ? "text-error-600"
                      : "text-success-600"
                  }`}
                >
                  {marginPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="inStock"
            className="block text-sm font-medium text-gray-700"
          >
            In Stock <span className="text-error-500">*</span>
          </label>
          <input
            id="inStock"
            type="number"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.inStock ? "border-error-500" : ""
            }`}
            {...register("inStock", { valueAsNumber: true })}
            disabled={loading}
          />
          {errors.inStock && (
            <p className="text-xs text-error-500">{errors.inStock.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="minStock"
            className="block text-sm font-medium text-gray-700"
          >
            Minimum Stock <span className="text-error-500">*</span>
          </label>
          <input
            id="minStock"
            type="number"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.minStock ? "border-error-500" : ""
            }`}
            {...register("minStock", { valueAsNumber: true })}
            disabled={loading}
          />
          {errors.minStock && (
            <p className="text-xs text-error-500">{errors.minStock.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </span>
          ) : (
            "Save Product"
          )}
        </button>
      </div>
    </form>
  )
}

export default ProductForm
