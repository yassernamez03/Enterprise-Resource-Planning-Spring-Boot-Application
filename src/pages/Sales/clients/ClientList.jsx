import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import PageHeader from "../../../Components/Sales/common/PageHeader";
import DataTable from "../../../Components/Sales/common/DataTable";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import { useAppContext } from "../../../context/Sales/AppContext";
import { clientService } from "../../../services/Sales/clientService";
import { handleForeignKeyError } from '../../../utils/errorHandlers';
import ErrorNotification from '../../../components/ErrorNotification';
import { useErrorNotification } from '../../../hooks/useErrorNotification';
// Add hashids import
import { encodeId } from "../../../utils/hashids";

const ClientList = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppContext();
  const { error, showAsDialog, showError, hideError, handleDeleteError } = useErrorNotification();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    sortBy: "name",
    sortOrder: "asc"
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    clientId: 0,
    clientName: ""
  });

  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients(pagination, {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      setAllClients(response.content || []);
      applyFilters(response.content || []);
      
      setPagination(prev => ({
        ...prev,
        total: response.totalElements || 0,
        page: response.number || 0,
        pageSize: response.size || 10
      }));
      
    } catch (error) {
      console.error("Error fetching clients:", error);
      showNotification(
        error.message || "Failed to load clients", 
        "error"
      );
      setAllClients([]);
      setFilteredClients([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (clientsData) => {
    let filtered = clientsData;

    if (filters.search) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        (client.phone && client.phone.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    setFilteredClients(filtered);
    setClients(filtered);
  };

  useEffect(() => {
    fetchClients();
  }, [pagination.page, pagination.pageSize, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    if (allClients.length > 0) {
      applyFilters(allClients);
    }
  }, [filters.search, allClients]);

  const handleSearch = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSearchDebounced = debounce(handleSearch, 500);

  const handleSort = (field, direction) => {
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: direction }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page: page - 1 }));
  };

  const handleAddClient = () => {
    navigate("/sales/clients/new");
  };

  const handleViewClient = (id) => {
    // Use encoded ID for navigation
    navigate(`/sales/clients/${encodeId(id)}`);
  };

  const handleEditClient = (id) => {
    // Use encoded ID for navigation
    navigate(`/sales/clients/${encodeId(id)}/edit`);
  };

  const handleDeletePrompt = (client) => {
    setDeleteDialog({
      open: true,
      clientId: client.id, // Keep integer ID for API call
      clientName: client.name
    });
  };

  const handleDeleteConfirm = async () => {
    console.log("CLIENT DELETE STARTED");
    
    try {
      await clientService.deleteClient(deleteDialog.clientId); // Use integer ID for API
      fetchClients();
      showNotification(
        `Client ${deleteDialog.clientName} deleted successfully`,
        "success"
      );
    } catch (error) {
      console.log("CLIENT DELETE FAILED:", error);
      handleDeleteError(error, 'Client', deleteDialog.clientName);
    } finally {
      setDeleteDialog({ open: false, clientId: 0, clientName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, clientId: 0, clientName: "" });
  };

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
      header: "Address",
      accessor: "address"
    }
  ];

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
            onChange={(e) => handleSearchDebounced(e)}
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
        currentPage={pagination.page + 1}
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange}
        onSort={handleSort}
        loading={loading}
        emptyMessage="No clients found"
        rowActions={(client) => (
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewClient(client.id);
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="View client"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditClient(client.id);
              }}
              className="text-gray-500 hover:text-primary-600"
              aria-label="Edit client"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePrompt(client);
              }}
              className="text-gray-500 hover:text-error-600"
              aria-label="Delete client"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
        onRowClick={(client) => handleViewClient(client.id)}
        keyExtractor={(client) => client.id}
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

      <ErrorNotification
        error={error}
        onClose={hideError}
        showAsDialog={showAsDialog}
        title="Cannot Delete Client"
      />
    </div>
  );
};

// Simple debounce function to prevent excessive API calls during search
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export default ClientList;