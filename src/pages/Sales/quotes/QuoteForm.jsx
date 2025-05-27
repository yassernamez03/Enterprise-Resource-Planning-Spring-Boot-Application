import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  createQuote,
  getQuote,
  updateQuote,
} from "../../../services/Sales/quoteService";
import { ArrowLeft, Save, Plus, Trash2, Send } from "lucide-react";
import { clientService } from "../../../services/Sales/clientService";
import { productService } from "../../../services/Sales/productService";

const schema = yup
  .object({
    clientId: yup.string().required("Client is required"),
    validUntil: yup.string().required("Valid until date is required"),
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
          description: yup.string(),
        })
      )
      .min(1, "At least one item is required"),
    notes: yup.string(),
    terms: yup.string(),
  })
  .required();

const calculateItemTotal = (item) => {
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  return quantity * unitPrice;
};

const QuoteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate default validUntil date (30 days from now)
  const getDefaultValidUntilDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: "",
      validUntil: getDefaultValidUntilDate(),
      items: [{ productId: "", quantity: 1, unitPrice: 0, description: "" }],
      notes: "",
      terms: "Standard terms and conditions apply.",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  useEffect(() => {
    // Load client and product data from APIs
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientsResponse, productsResponse] = await Promise.all([
          clientService.getClients({ page: 0, pageSize: 100 }, {}),
          productService.getProducts({ page: 0, pageSize: 100 }, {}),
        ]);

        // Handle clients data - Fix by checking all possible response structures
        let clientsData = [];
        if (clientsResponse?.data?.content) {
          // Spring pagination format
          clientsData = clientsResponse.data.content;
        } else if (clientsResponse?.content) {
          // Alternative Spring pagination format
          clientsData = clientsResponse.content;
        } else if (
          clientsResponse?.data &&
          Array.isArray(clientsResponse.data)
        ) {
          // Direct data array
          clientsData = clientsResponse.data;
        } else if (Array.isArray(clientsResponse)) {
          // Direct array response
          clientsData = clientsResponse;
        }

        // Handle products data
        let productsData = [];
        if (productsResponse?.data?.content) {
          productsData = productsResponse.data.content;
        } else if (productsResponse?.content) {
          productsData = productsResponse.content;
        } else if (
          productsResponse?.data &&
          Array.isArray(productsResponse.data)
        ) {
          productsData = productsResponse.data;
        } else if (Array.isArray(productsResponse)) {
          productsData = productsResponse;
        }

        setClients(clientsData);
        setProducts(productsData);

        console.log("Clients data:", clientsData);
        console.log("Products data:", productsData);
      } catch (err) {
        setError("Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (isEditMode && id) {
      setLoading(true);
      getQuote(id)
        .then((quoteData) => {
          // Handle date formatting safely
          const validUntil = quoteData.validUntil
            ? new Date(quoteData.validUntil).toISOString().split("T")[0]
            : getDefaultValidUntilDate();

          reset({
            clientId: quoteData.clientId,
            validUntil,
            items: quoteData.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              description: item.description || "",
            })),
            notes: quoteData.notes,
            terms: quoteData.terms,
          });
          setDiscount(quoteData.discount || 0);
          setTax(quoteData.tax || 0);
        })
        .catch((err) => {
          setError("Failed to load quote");
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEditMode, reset]);

  useEffect(() => {
    // Calculate totals when items change
    let newSubtotal = 0;

    watchItems?.forEach((item) => {
      newSubtotal += calculateItemTotal(item);
    });

    setSubtotal(newSubtotal);

    const discountAmount = newSubtotal * (discount / 100);
    const taxAmount = (newSubtotal - discountAmount) * (tax / 100);
    setTotal(newSubtotal - discountAmount + taxAmount);
  }, [watchItems, discount, tax]);

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p.id.toString() === productId);
    if (product) {
      setValue(`items.${index}.unitPrice`, product.price);
    }
  };

  const addItem = () => {
    append({ productId: "", quantity: 1, unitPrice: 0, description: "" });
  };

  const removeItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data, status = "DRAFT") => {
    try {
      setLoading(true);

      const client = clients.find((c) => c.id.toString() === data.clientId);

      const quoteData = {
        clientId: data.clientId,
        clientName: client?.name || "",
        employeeId: localStorage.getItem("employeeId") || "1",
        items: data.items.map((item) => {
          const product = products.find(
            (p) => p.id.toString() === item.productId
          );
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description || "",
            productName: product?.name || "",
          };
        }),
        subtotal,
        discount,
        tax,
        total,
        notes: data.notes || "",
        terms: data.terms || "",
        status,
        validUntil: data.validUntil,
      };

      if (isEditMode && id) {
        await updateQuote(id, quoteData);
      } else {
        await createQuote(quoteData);
      }

      navigate("/sales/quotes");
    } catch (err) {
      setError("Failed to save quote");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode)
    return <div className="flex justify-center p-8">Loading quote data...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? "Edit Quote" : "Create New Quote"}
        </h1>
        <button
          onClick={() => navigate("/sales/quotes")}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Quotes
        </button>
      </div>

      <form onSubmit={handleSubmit((data) => onSubmit(data))}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
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
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name || `Client ${client.id}`}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <Controller
                name="validUntil"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    {...field}
                    className={`w-full p-2 border rounded-md ${
                      errors.validUntil ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                )}
              />
              {errors.validUntil && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.validUntil.message}
                </p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              Quote Summary
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
                    onChange={(e) => setDiscount(Number(e.target.value))}
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
                    onChange={(e) => setTax(Number(e.target.value))}
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
            <h2 className="text-lg font-medium text-gray-800">Quote Items</h2>
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
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => {
                  const itemErrors = errors.items?.[index];
                  const item = watchItems?.[index];
                  const itemTotal = item ? calculateItemTotal(item) : 0;

                  return (
                    <tr key={field.id}>
                      <td className="px-4 py-2">
                        <Controller
                          name={`items.${index}.productId`}
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleProductSelect(index, e.target.value);
                              }}
                              className={`w-full p-2 border rounded-md ${
                                itemErrors?.productId
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">Select a product</option>
                              {products.map((product) => (
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
                              onChange={(e) =>
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
                              onChange={(e) =>
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
                          name={`items.${index}.description`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="text"
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Item description"
                            />
                          )}
                        />
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
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
                  placeholder="Add any relevant notes about this quote"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Terms & Conditions
            </label>
            <Controller
              name="terms"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={4}
                  placeholder="Terms and conditions for this quote"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/sales/quotes")}
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
            Save as Draft
          </button>

          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, "SENT"))}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            disabled={loading}
          >
            <Send size={18} className="mr-1" />
            Save & Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteForm;
