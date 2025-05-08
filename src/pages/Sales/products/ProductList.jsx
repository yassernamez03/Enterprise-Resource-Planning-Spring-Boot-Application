import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import PageHeader from "../../../Components/Sales/common/PageHeader"
import DataTable from "../../../Components/Sales/common/DataTable"
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog"
import { useAppContext } from "../../../context/Sales/AppContext"

// Mock data for development
const MOCK_PRODUCTS = [
  {
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
  },
  {
    id: 2,
    name: "Standard Widget",
    description: "Reliable widget for everyday use",
    sku: "WDG-002",
    price: 29.99,
    cost: 12.99,
    categoryId: 1,
    category: { id: 1, name: "Electronics" },
    inStock: 200,
    minStock: 30,
    isActive: true,
    createdAt: "2023-02-15T09:15:00.000Z",
    updatedAt: "2023-04-18T11:30:00.000Z"
  },
  {
    id: 3,
    name: "Basic Widget",
    description: "Affordable widget with essential features",
    sku: "WDG-003",
    price: 19.99,
    cost: 7.99,
    categoryId: 1,
    category: { id: 1, name: "Electronics" },
    inStock: 300,
    minStock: 50,
    isActive: true,
    createdAt: "2023-03-05T10:45:00.000Z",
    updatedAt: "2023-06-12T16:20:00.000Z"
  },
  {
    id: 4,
    name: "Deluxe Gadget",
    description: "Feature-rich gadget for professionals",
    sku: "GDT-001",
    price: 89.99,
    cost: 39.99,
    categoryId: 1,
    category: { id: 1, name: "Electronics" },
    inStock: 75,
    minStock: 15,
    isActive: true,
    createdAt: "2023-01-20T12:00:00.000Z",
    updatedAt: "2023-05-25T09:10:00.000Z"
  },
  {
    id: 5,
    name: "Office Chair",
    description: "Ergonomic office chair with lumbar support",
    sku: "FRN-001",
    price: 199.99,
    cost: 89.99,
    categoryId: 3,
    category: { id: 3, name: "Furniture" },
    inStock: 25,
    minStock: 5,
    isActive: true,
    createdAt: "2023-02-25T11:30:00.000Z",
    updatedAt: "2023-04-30T13:45:00.000Z"
  }
]

const ProductList = () => {
  const navigate = useNavigate()
  const { showNotification } = useAppContext()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    categoryId: "",
    isActive: "true"
  })

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    productId: 0,
    productName: ""
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        // In a real app, use the API service
        // const response = await getProducts(pagination, filters);
        // setProducts(response.data);
        // setPagination({ ...pagination, total: response.total });

        // Using mock data for development
        setTimeout(() => {
          // Apply filters to mock data
          let filteredProducts = [...MOCK_PRODUCTS]

          if (filters.search) {
            const search = filters.search.toLowerCase()
            filteredProducts = filteredProducts.filter(
              product =>
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search) ||
                product.description.toLowerCase().includes(search)
            )
          }

          if (filters.categoryId) {
            filteredProducts = filteredProducts.filter(
              product => product.categoryId === Number(filters.categoryId)
            )
          }

          if (filters.isActive === "true") {
            filteredProducts = filteredProducts.filter(
              product => product.isActive
            )
          } else if (filters.isActive === "false") {
            filteredProducts = filteredProducts.filter(
              product => !product.isActive
            )
          }

          // Sort
          filteredProducts.sort((a, b) => {
            const field = filters.sortBy || "name"
            const order = filters.sortOrder === "desc" ? -1 : 1

            // @ts-ignore
            if (a[field] < b[field]) return -1 * order
            // @ts-ignore
            if (a[field] > b[field]) return 1 * order
            return 0
          })

          setProducts(filteredProducts)
          setPagination({ ...pagination, total: filteredProducts.length })
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching products:", error)
        showNotification("Failed to load products", "error")
        setLoading(false)
      }
    }

    fetchProducts()
  }, [pagination.page, pagination.pageSize, filters])

  const handleSearch = e => {
    const search = e.target.value
    setFilters({ ...filters, search })
  }

  const handleFilterChange = e => {
    const { name, value } = e.target
    setFilters({ ...filters, [name]: value })
  }

  const handleSort = (field, direction) => {
    setFilters({ ...filters, sortBy: field, sortOrder: direction })
  }

  const handlePageChange = page => {
    setPagination({ ...pagination, page })
  }

  const handleAddProduct = () => {
    navigate("/sales/products/new")
  }

  const handleViewProduct = id => {
    navigate(`/sales/products/${id}`)
  }

  const handleEditProduct = id => {
    navigate(`/sales/products/${id}/edit`)
  }

  const handleDeletePrompt = product => {
    setDeleteDialog({
      open: true,
      productId: product.id,
      productName: product.name
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      // In a real app, call the delete API
      // await deleteProduct(deleteDialog.productId);

      // In development, filter the product from the list
      const updatedProducts = products.filter(
        p => p.id !== deleteDialog.productId
      )
      setProducts(updatedProducts)

      showNotification(
        `Product ${deleteDialog.productName} deleted successfully`,
        "success"
      )
    } catch (error) {
      console.error("Error deleting product:", error)
      showNotification("Failed to delete product", "error")
    } finally {
      setDeleteDialog({ open: false, productId: 0, productName: "" })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, productId: 0, productName: "" })
  }

  const productColumns = [
    {
      header: "Product Name",
      accessor: "name",
      sortable: true
    },
    {
      header: "SKU",
      accessor: "sku",
      sortable: true
    },
    {
      header: "Category",
      accessor: "category.name"
    },
    {
      header: "Price",
      accessor: "price",
      sortable: true,
      cell: product => `$${product.price.toFixed(2)}`
    },
    {
      header: "In Stock",
      accessor: "inStock",
      sortable: true,
      cell: product => {
        const isLow = product.inStock <= product.minStock
        return (
          <span className={isLow ? "text-error-600 font-medium" : ""}>
            {product.inStock}
          </span>
        )
      }
    },
    {
      header: "Status",
      accessor: "isActive",
      cell: product => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            product.isActive
              ? "bg-success-100 text-success-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {product.isActive ? "Active" : "Inactive"}
        </span>
      )
    }
  ]

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
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={handleSearch}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
        </div>

        <div className="flex space-x-2">
          <select
            name="categoryId"
            value={filters.categoryId}
            onChange={handleFilterChange}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
          >
            <option value="">All Categories</option>
            <option value="1">Electronics</option>
            <option value="2">Office Supplies</option>
            <option value="3">Furniture</option>
            <option value="4">Software</option>
          </select>

          <select
            name="isActive"
            value={filters.isActive}
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
        currentPage={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No products found"
        rowActions={product => (
          <div className="flex space-x-2">
            <button
              onClick={e => {
                e.stopPropagation()
                handleViewProduct(product.id)
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="View product"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleEditProduct(product.id)
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="Edit product"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleDeletePrompt(product)
              }}
              className="text-gray-500 hover:text-error-600"
              aria-label="Delete product"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        onRowClick={product => handleViewProduct(product.id)}
        keyExtractor={product => product.id}
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
    </div>
  )
}

export default ProductList
