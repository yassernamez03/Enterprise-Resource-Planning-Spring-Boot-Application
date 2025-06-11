import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import PageHeader from "../../../Components/Sales/common/PageHeader";
import DataTable from "../../../Components/Sales/common/DataTable";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import { useAppContext } from "../../../context/Sales/AppContext";
import { productService } from "../../../services/Sales/productService";
import { handleForeignKeyError } from '../../../utils/errorHandlers';
import ErrorNotification from '../../../components/ErrorNotification';
import { useErrorNotification } from '../../../hooks/useErrorNotification';

const ProductList = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppContext();
  const { error, showAsDialog, showError, hideError, handleDeleteError } = useErrorNotification();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0, // Spring uses 0-based indexing
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    category: "",
    active: "true",
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    productId: 0,
    productName: "",
  });

  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [filteredProducts, setFilteredProducts] = useState([]); // Store filtered products

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Remove filters from API call temporarily
      const response = await productService.getProducts(pagination, {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      setAllProducts(response.data);
      // Apply client-side filtering
      applyFilters(response.data);

      setPagination((prev) => ({
        ...prev,
        total: response.total,
        page: response.page || pagination.page,
        pageSize: response.pageSize || pagination.pageSize,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      showNotification(error.message || "Failed to load products", "error");
      setAllProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (products) => {
    let filtered = products;

    // Apply search filter
    if (filters.search) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.sku.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category.name === filters.category
      );
    }

    // Apply active filter
    if (filters.active !== "") {
      const isActive = filters.active === "true";
      filtered = filtered.filter((product) => product.isActive === isActive);
    }

    setFilteredProducts(filtered);
    setProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.pageSize, filters.sortBy, filters.sortOrder]);

  // Separate effect for search and filters - this handles client-side filtering
  useEffect(() => {
    if (allProducts.length > 0) {
      applyFilters(allProducts);
    }
  }, [filters.search, filters.category, filters.active, allProducts]);

  const handleSearch = (e) => {
    const search = e.target.value;
    setFilters((prev) => ({ ...prev, search }));
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handleSearchDebounced = debounce(handleSearch, 500);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Reset to first page when filtering
    setPagination((prev) => ({ ...prev, page: 0 }));

    // Remove this line - let useEffect handle the filtering
    // fetchProducts();
  };

  const handleSort = (field, direction) => {
    // Map frontend field names to backend field names
    const fieldMap = {
      price: "unitPrice",
      isActive: "active",
      inStock: "stock",
    };

    const backendField = fieldMap[field] || field;
    setFilters((prev) => ({
      ...prev,
      sortBy: backendField,
      sortOrder: direction,
    }));
  };

  // Fixed handlePageChange function - convert from 1-based to 0-based for Spring
  const handlePageChange = (page) => {
    // Adjust page to 0-based for Spring
    setPagination((prev) => ({ ...prev, page: page - 1 }));
  };

  const handleAddProduct = () => {
    navigate("/sales/products/new");
  };

  const handleViewProduct = (id) => {
    navigate(`/sales/products/${id}`);
  };

  const handleEditProduct = (id) => {
    navigate(`/sales/products/${id}/edit`);
  };

  const handleDeletePrompt = (product) => {
    setDeleteDialog({
      open: true,
      productId: product.id,
      productName: product.name,
    });
  };

  const handleDeleteConfirm = async () => {
    console.log("DELETE ATTEMPT STARTED for:", deleteDialog.productName);
    
    try {
      await productService.deleteProduct(deleteDialog.productId);
      fetchProducts();
      showNotification(
        `Product ${deleteDialog.productName} deleted successfully`,
        "success"
      );
      console.log("DELETE SUCCESS");
    } catch (error) {
      console.log("DELETE FAILED - Error caught:", error);
      handleDeleteError(error, 'Product', deleteDialog.productName);
    } finally {
      setDeleteDialog({ open: false, productId: 0, productName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, productId: 0, productName: "" });
  };

  const productColumns = [
    {
      header: "Product Name",
      accessor: "name",
      sortable: true,
    },
    {
      header: "SKU",
      accessor: "sku",
      sortable: true,
    },
    {
      header: "Category",
      accessor: "category.name",
    },
    {
      header: "Price",
      accessor: "price",
      sortable: true,
      cell: (product) => `$${parseFloat(product.price).toFixed(2)}`,
    },
    {
      header: "In Stock",
      accessor: "inStock",
      sortable: true,
      cell: (product) => {
        const isLow = product.inStock <= product.minStock;
        return (
          <span className={isLow ? "text-error-600 font-medium" : ""}>
            {product.inStock}
          </span>
        );
      },
    },
    {
      header: "Status",
      accessor: "isActive",
      cell: (product) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.isActive
              ? "bg-success-100 text-success-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog"
        actions={
          <button
            onClick={handleAddProduct}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </button>
        }
      />

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search products..."
            onChange={(e) => handleSearchDebounced(e)}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
        </div>

        <div className="flex space-x-2">
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
          >
            <option value="">All Categories</option>
            <option value="Stationery">Stationery</option>
            <option value="Marketing Materials">Marketing Materials</option>
            <option value="Signage">Signage</option>
            <option value="Documents">Documents</option>
            <option value="Promotional">Promotional</option>
          </select>

          <select
            name="active"
            value={filters.active}
            onChange={handleFilterChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <DataTable
        data={products}
        columns={productColumns}
        total={pagination.total}
        currentPage={pagination.page + 1} // Convert 0-based to 1-based for display
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No products found"
        rowActions={(product) => (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewProduct(product.id);
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="View product"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditProduct(product.id);
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="Edit product"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePrompt(product);
              }}
              className="text-gray-500 hover:text-error-600"
              aria-label="Delete product"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        onRowClick={(product) => handleViewProduct(product.id)}
        keyExtractor={(product) => product.id}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Product"
        message={`Are you sure you want to delete ${deleteDialog.productName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />

      {/* Add the error notification component */}
      <ErrorNotification
        error={error}
        onClose={hideError}
        showAsDialog={showAsDialog}
        title="Cannot Delete Product"
      />
    </div>
  );
};

// Simple debounce function to prevent excessive API calls during search
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export default ProductList;
