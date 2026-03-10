import React from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

const schema = yup
  .object({
    name: yup.string().required("Client name is required"),
    contactPerson: yup.string(),
    email: yup
      .string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: yup.string().required("Phone number is required"),
    address: yup.string().required("Address is required"),
    notes: yup.string()
  })
  .required();

  const ClientForm = ({ initialData, onSubmit, onCancel, loading = false }) => {
    const {
      register,
      handleSubmit,
      formState: { errors }
    } = useForm({
      resolver: yupResolver(schema),
      defaultValues: initialData
        ? {
            name: initialData.name,
            contactPerson: initialData.contactPerson || "",
            email: initialData.email,
            phone: initialData.phone,
            address: initialData.address,
            notes: initialData.notes || ""
          }
        : {}
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Client Name <span className="text-error-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.name ? "border-error-500" : ""
            }`}
            placeholder="Acme Inc."
            {...register("name")}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-xs text-error-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email <span className="text-error-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.email ? "border-error-500" : ""
            }`}
            placeholder="contact@company.com"
            {...register("email")}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-xs text-error-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone <span className="text-error-500">*</span>
          </label>
          <input
            id="phone"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.phone ? "border-error-500" : ""
            }`}
            placeholder="+1 (555) 123-4567"
            {...register("phone")}
            disabled={loading}
          />
          {errors.phone && (
            <p className="text-xs text-error-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="taxId"
            className="block text-sm font-medium text-gray-700"
          >
            Tax ID / VAT Number
          </label>
          <input
            id="taxId"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Tax ID"
            {...register("taxId")}
            disabled={loading}
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address <span className="text-error-500">*</span>
          </label>
          <input
            id="address"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.address ? "border-error-500" : ""
            }`}
            placeholder="123 Main St, Suite 101"
            {...register("address")}
            disabled={loading}
          />
          {errors.address && (
            <p className="text-xs text-error-500">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700"
          >
            City <span className="text-error-500">*</span>
          </label>
          <input
            id="city"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.city ? "border-error-500" : ""
            }`}
            placeholder="San Francisco"
            {...register("city")}
            disabled={loading}
          />
          {errors.city && (
            <p className="text-xs text-error-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="state"
            className="block text-sm font-medium text-gray-700"
          >
            State / Province <span className="text-error-500">*</span>
          </label>
          <input
            id="state"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.state ? "border-error-500" : ""
            }`}
            placeholder="CA"
            {...register("state")}
            disabled={loading}
          />
          {errors.state && (
            <p className="text-xs text-error-500">{errors.state.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="zipCode"
            className="block text-sm font-medium text-gray-700"
          >
            Zip / Postal Code <span className="text-error-500">*</span>
          </label>
          <input
            id="zipCode"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.zipCode ? "border-error-500" : ""
            }`}
            placeholder="94105"
            {...register("zipCode")}
            disabled={loading}
          />
          {errors.zipCode && (
            <p className="text-xs text-error-500">{errors.zipCode.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700"
          >
            Country <span className="text-error-500">*</span>
          </label>
          <input
            id="country"
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
              errors.country ? "border-error-500" : ""
            }`}
            placeholder="United States"
            {...register("country")}
            disabled={loading}
          />
          {errors.country && (
            <p className="text-xs text-error-500">{errors.country.message}</p>
          )}
        </div>

        <div className="space-y-1 md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Additional information about the client..."
            {...register("notes")}
            disabled={loading}
          ></textarea>
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
            "Save Client"
          )}
        </button>
      </div>
    </form>
  )
}

export default ClientForm
