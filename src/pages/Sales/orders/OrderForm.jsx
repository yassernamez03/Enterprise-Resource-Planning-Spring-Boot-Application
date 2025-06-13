import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  createOrder,
  getOrder,
  updateOrder,
} from "../../../services/Sales/orderService";
import { clientService } from "../../../services/Sales/clientService";
import { productService } from "../../../services/Sales/productService";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
// Add hashids import
import { decodeId, encodeId } from "../../../utils/hashids";

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
          description: yup.string(),
        })
      )
      .min(1, "At least one item is required"),
    notes: yup.string(),
    quoteId: yup.string(),
  })
  .required();

const calculateItemTotal = (item) => {
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  return quantity * unitPrice;
};

const OrderForm = () => {
  const { id: hashId } = useParams(); // Get the hashed ID from URL
  const navigate = useNavigate();
  const isEditMode = Boolean(hashId);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actualId, setActualId] = useState(null); // Store the decoded integer ID

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
      items: [{ productId: "", quantity: 1, unitPrice: 0, description: "" }],
      notes: "",
      quoteId: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResponse, productsResponse] = await Promise.all([
          clientService.getClients({ page: 0, pageSize: 100 }, {}),
          productService.getProducts({ page: 0, pageSize: 100 }, {}),
        ]);

        // Enhanced client data handling - check all possible response structures
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

        // Enhanced product data handling - check all possible response structures
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
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      }
    };

    fetchData();

    if (isEditMode && hashId) {
      // Decode the hash to get the actual integer ID
      const decodedId = decodeId(hashId);
      
      if (!decodedId) {
        setError("Invalid order ID");
        return;
      }
      
      setActualId(decodedId);
      setLoading(true);
      getOrder(decodedId) // Use integer ID for API call
        .then((orderData) => {
          reset({
            clientId: orderData.clientId?.toString(),
            items: orderData.items.map((item) => ({
              productId: item.productId?.toString(),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              description: item.description || "",
            })),
            notes: orderData.notes || "",
            quoteId: orderData.quoteId?.toString() || "",
          });

          // Set calculated values from backend if they exist
          if (orderData.subtotal) setSubtotal(orderData.subtotal);
          if (orderData.discount) setDiscount(orderData.discount);
          if (orderData.tax) setTax(orderData.tax);
          if (orderData.totalAmount) setTotal(orderData.totalAmount);
        })
        .catch((err) => {
          setError("Failed to load order");
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [hashId, isEditMode, reset]);

  // Modify the useEffect that handles calculations
  useEffect(() => {
    // Calculate totals whenever items, discount, or tax change
    if (watchItems?.length > 0) {
      let newSubtotal = 0;

      watchItems.forEach((item) => {
        if (item.quantity && item.unitPrice) {
          newSubtotal += calculateItemTotal(item);
        }
      });

      setSubtotal(newSubtotal);

      const discountAmount = newSubtotal * (discount / 100);
      const taxAmount = (newSubtotal - discountAmount) * (tax / 100);
      setTotal(newSubtotal - discountAmount + taxAmount);
    }
  }, [watchItems, discount, tax]);

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p.id.toString() === productId);
    if (product) {
      // Temporarily store the current values
      const currentQuantity = watchItems?.[index]?.quantity || 1;

      // Update the price with the product's price
      setValue(`items.${index}.unitPrice`, product.price || 0);

      // Ensure we update immediately by forcing the calculation
      const updatedItem = {
        ...watchItems[index],
        productId,
        unitPrice: product.price || 0,
        quantity: currentQuantity,
      };
      const updatedItems = [...watchItems];
      updatedItems[index] = updatedItem;

      // Update the subtotal immediately
      let newSubtotal = 0;
      updatedItems.forEach((item) => {
        if (item.quantity && item.unitPrice) {
          newSubtotal += calculateItemTotal(item);
        }
      });

      setSubtotal(newSubtotal);

      const discountAmount = newSubtotal * (discount / 100);
      const taxAmount = (newSubtotal - discountAmount) * (tax / 100);
      setTotal(newSubtotal - discountAmount + taxAmount);
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

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const client = clients.find((c) => c.id.toString() === data.clientId);

      const orderData = {
        clientId: data.clientId,
        items: data.items.map((item) => {
          const product = products.find(
            (p) => p.id.toString() === item.productId
          );
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            description: item.description || "",
          };
        }),
        notes: data.notes || "",
        quoteId: data.quoteId || null,
      };

      let result;
      if (isEditMode && actualId) {
        result = await updateOrder(actualId, orderData); // Use integer ID for API
        // Navigate back to the order detail using the original hash
        navigate(`/sales/orders/${hashId}`);
      } else {
        result = await createOrder(orderData);
        // For new orders, encode the returned ID for navigation
        if (result && result.id) {
          navigate(`/sales/orders/${encodeId(result.id)}`);
        } else {
          navigate("/sales/orders");
        }
      }
    } catch (err) {
      setError("Failed to save order");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode)
    return <div className="flex justify-center p-8">Loading order data...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/sales/orders")}
            className="mr-4 p-2 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? "Edit Order" : "Create New Order"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Quote (Optional)
              </label>
              <Controller
                name="quoteId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">No related quote</option>
                    {/* You would typically fetch quotes here if needed */}
                  </select>
                )}
              />
            </div>
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
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                field.onChange(newValue);

                                // Update calculations immediately
                                const updatedItems = [...watchItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  quantity: newValue,
                                };

                                // Recalculate totals
                                let newSubtotal = 0;
                                updatedItems.forEach((item) => {
                                  if (item.quantity && item.unitPrice) {
                                    newSubtotal += calculateItemTotal(item);
                                  }
                                });

                                setSubtotal(newSubtotal);
                                const discountAmount = newSubtotal * (discount / 100);
                                const taxAmount = (newSubtotal - discountAmount) * (tax / 100);
                                setTotal(newSubtotal - discountAmount + taxAmount);
                              }}
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
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                field.onChange(newValue);

                                // Update calculations immediately
                                const updatedItems = [...watchItems];
                                updatedItems[index] = {
                                  ...updatedItems[index],
                                  unitPrice: newValue,
                                };

                                // Recalculate totals
                                let newSubtotal = 0;
                                updatedItems.forEach((item) => {
                                  if (item.quantity && item.unitPrice) {
                                    newSubtotal += calculateItemTotal(item);
                                  }
                                });

                                setSubtotal(newSubtotal);
                                const discountAmount = newSubtotal * (discount / 100);
                                const taxAmount = (newSubtotal - discountAmount) * (tax / 100);
                                setTotal(newSubtotal - discountAmount + taxAmount);
                              }}
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
  );
};

export default OrderForm;
