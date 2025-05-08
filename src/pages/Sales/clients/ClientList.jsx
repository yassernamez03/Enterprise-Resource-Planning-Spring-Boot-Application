import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import PageHeader from "../../../Components/Sales/common/PageHeader"
import DataTable from "../../../Components/Sales/common/DataTable"
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog"
import { useAppContext } from "../../../context/Sales/AppContext"

// Mock data for development
const MOCK_CLIENTS = [
  {
    id: 1,
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Suite 101",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    country: "United States",
    taxId: "US1234567890",
    notes: "Major technology client with multiple divisions",
    createdAt: "2023-01-15T08:30:00.000Z",
    updatedAt: "2023-05-20T14:45:00.000Z"
  },
  {
    id: 2,
    name: "Globex Industries",
    email: "info@globex.com",
    phone: "+1 (555) 987-6543",
    address: "456 Tech Blvd",
    city: "Boston",
    state: "MA",
    zipCode: "02110",
    country: "United States",
    taxId: "US9876543210",
    notes: "Manufacturing client with international operations",
    createdAt: "2023-02-10T09:15:00.000Z",
    updatedAt: "2023-04-18T11:30:00.000Z"
  },
  {
    id: 3,
    name: "Oceanic Airlines",
    email: "support@oceanic.com",
    phone: "+1 (555) 765-4321",
    address: "789 Sky Way",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90045",
    country: "United States",
    createdAt: "2023-03-05T10:45:00.000Z",
    updatedAt: "2023-06-12T16:20:00.000Z"
  },
  {
    id: 4,
    name: "Stark Industries",
    email: "sales@stark.com",
    phone: "+1 (555) 234-5678",
    address: "1 Avengers Tower",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
    taxId: "US2468101214",
    notes: "High-tech research and development client",
    createdAt: "2023-01-20T12:00:00.000Z",
    updatedAt: "2023-05-25T09:10:00.000Z"
  },
  {
    id: 5,
    name: "Wayne Enterprises",
    email: "info@wayne.com",
    phone: "+1 (555) 876-5432",
    address: "1007 Mountain Drive",
    city: "Gotham",
    state: "NJ",
    zipCode: "08701",
    country: "United States",
    taxId: "US1357924680",
    createdAt: "2023-02-25T11:30:00.000Z",
    updatedAt: "2023-04-30T13:45:00.000Z"
  }
]

const ClientList = () => {
  const navigate = useNavigate()
  const { showNotification } = useAppContext()

  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "name",
    sortOrder: "asc"
  })

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    clientId: 0,
    clientName: ""
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)

        // In a real app, use the API service
        // const response = await getClients(pagination, filters);
        // setClients(response.data);
        // setPagination({ ...pagination, total: response.total });

        // Using mock data for development
        setTimeout(() => {
          setClients(MOCK_CLIENTS)
          setPagination({ ...pagination, total: MOCK_CLIENTS.length })
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error("Error fetching clients:", error)
        showNotification("Failed to load clients", "error")
        setLoading(false)
      }
    }

    fetchClients()
  }, [pagination.page, pagination.pageSize, filters.sortBy, filters.sortOrder])

  const handleSearch = e => {
    const search = e.target.value
    setFilters({ ...filters, search })

    // In development, filter the mock data
    if (search.trim() === "") {
      setClients(MOCK_CLIENTS)
    } else {
      const filtered = MOCK_CLIENTS.filter(
        client =>
          client.name.toLowerCase().includes(search.toLowerCase()) ||
          client.email.toLowerCase().includes(search.toLowerCase())
      )
      setClients(filtered)
    }
  }

  const handleSort = (field, direction) => {
    setFilters({ ...filters, sortBy: field, sortOrder: direction })
  }

  const handlePageChange = page => {
    setPagination({ ...pagination, page })
  }

  const handleAddClient = () => {
    navigate("/sales/clients/new")
  }

  const handleViewClient = id => {
    navigate(`/sales/clients/${id}`)
  }

  const handleEditClient = id => {
    navigate(`/sales/clients/${id}/edit`)
  }

  const handleDeletePrompt = client => {
    setDeleteDialog({
      open: true,
      clientId: client.id,
      clientName: client.name
    })
  }

  const handleDeleteConfirm = async () => {
    try {
      // In a real app, call the delete API
      // await deleteClient(deleteDialog.clientId);

      // In development, filter the client from the list
      const updatedClients = clients.filter(c => c.id !== deleteDialog.clientId)
      setClients(updatedClients)

      showNotification(
        `Client ${deleteDialog.clientName} deleted successfully`,
        "success"
      )
    } catch (error) {
      console.error("Error deleting client:", error)
      showNotification("Failed to delete client", "error")
    } finally {
      setDeleteDialog({ open: false, clientId: 0, clientName: "" })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, clientId: 0, clientName: "" })
  }

  const clientColumns = [
    {
      header: "Client Name",
      accessor: "name",
      sortable: true
    },
    {
      header: "Email",
      accessor: "email"
    },
    {
      header: "Phone",
      accessor: "phone"
    },
    {
      header: "City",
      accessor: "city"
    },
    {
      header: "Country",
      accessor: "country"
    }
  ]

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage your client accounts"
        actions={
          <button
            onClick={handleAddClient}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus size={16} className="mr-2" />
            Add Client
          </button>
        }
      />

      <div className="mb-6">
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search clients..."
            value={filters.search}
            onChange={handleSearch}
            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
        </div>
      </div>

      <DataTable
        data={clients}
        columns={clientColumns}
        total={pagination.total}
        currentPage={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No clients found"
        rowActions={client => (
          <div className="flex space-x-2">
            <button
              onClick={e => {
                e.stopPropagation()
                handleViewClient(client.id)
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="View client"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleEditClient(client.id)
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="Edit client"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                handleDeletePrompt(client)
              }}
              className="text-gray-500 hover:text-error-600"
              aria-label="Delete client"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        onRowClick={client => handleViewClient(client.id)}
        keyExtractor={client => client.id}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        title="Delete Client"
        message={`Are you sure you want to delete ${deleteDialog.clientName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
      />
    </div>
  )
}

export default ClientList
