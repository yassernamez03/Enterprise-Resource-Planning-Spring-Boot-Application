import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { productService } from "../../../../services/Sales/productService";

const schema = yup
  .object({
    name: yup.string().required("Product name is required"),
    description: yup.string(),
    unitPrice: yup
      .number()
      .positive("Price must be positive")
      .required("Price is required"),
    category: yup.string(),
    active: yup.boolean(),
  })
  .required();

const ProductForm = ({ initialData, onSubmit, onCancel, loading = false }) => {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          unitPrice: initialData.price || 0, // Map price to unitPrice
          category: initialData.category?.name || "",
          active: initialData.isActive ?? true,
        }
      : {
          active: true,
        }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        
        // Fallback to mock categories
        const MOCK_CATEGORIES = [
          { id: 1, name: "Promotional" },
          { id: 2, name: "Stationery" },
          { id: 3, name: "Marketing Materials" },
          { id: 4, name: "Signage" },
          { id: 5, name: "Documents" }
        ];
        setCategories(MOCK_CATEGORIES);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="space-y-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name <span className="text-error-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.name ? "border-error-500" : ""
            }`}
            {...register("name")}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-xs text-error-500">{errors.name.message}</p>
          )}
        </div>

        {/* Category Field */}
        <div className="space-y-1">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.category ? "border-error-500" : ""
            }`}
            {...register("category")}
            disabled={loading || categoriesLoading}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-error-500">{errors.category.message}</p>
          )}
        </div>

        {/* Description Field */}
        <div className="space-y-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.description ? "border-error-500" : ""
            }`}
            {...register("description")}
            disabled={loading}
          />
          {errors.description && (
            <p className="text-xs text-error-500">{errors.description.message}</p>
          )}
        </div>

        {/* Unit Price Field */}
        <div className="space-y-1">
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
            Unit Price <span className="text-error-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              id="unitPrice"
              type="number"
              step="0.01"
              min="0"
              className={`mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                errors.unitPrice ? "border-error-500" : ""
              }`}
              {...register("unitPrice")}
              disabled={loading}
            />
          </div>
          {errors.unitPrice && (
            <p className="text-xs text-error-500">{errors.unitPrice.message}</p>
          )}
        </div>

        {/* Active Status Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              {...register("active")}
              disabled={loading}
            />
            <label htmlFor="active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;