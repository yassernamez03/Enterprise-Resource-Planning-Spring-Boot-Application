import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import PageHeader from "../../../Components/Sales/common/PageHeader";
import DataTable from "../../../Components/Sales/common/DataTable";
import ConfirmDialog from "../../../Components/Sales/common/ConfirmDialog";
import { useAppContext } from "../../../context/Sales/AppContext";
import { clientService } from "../../../services/Sales/clientService";

const ClientList = () => {
  const navigate = useNavigate();
  const { showNotification } = useAppContext();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0, // Spring uses 0-based indexing
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

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientService.getClients(pagination, filters);
      
      setClients(response.content || []);
      setPagination(prev => ({
        ...prev,
        total: response.totalElements || 0,
        page: response.number || 0, // Using Spring's returned page number
        pageSize: response.size || 10
      }));
      
    } catch (error) {
      console.error("Error fetching clients:", error);
      showNotification(
        error.message || "Failed to load clients", 
        "error"
      );
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [pagination.page, pagination.pageSize, filters.sortBy, filters.sortOrder]);

  const handleSearch = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));
    
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 0 }));
    
    // Trigger fetch with updated search parameter
    fetchClients();
  };

  const handleSearchDebounced = debounce(handleSearch, 500);

  const handleSort = (field, direction) => {
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: direction }));
  };

  // Fixed handlePageChange function - convert from 1-based to 0-based for Spring
  const handlePageChange = (page) => {
    // Adjust page to 0-based for Spring
    setPagination(prev => ({ ...prev, page: page - 1 }));
  };

  const handleAddClient = () => {
    navigate("/sales/clients/create");
  };

  const handleViewClient = (id) => {
    navigate(`/sales/clients/${id}`);
  };

  const handleEditClient = (id) => {
    navigate(`/sales/clients/${id}/edit`);
  };

  const handleDeletePrompt = (client) => {
    setDeleteDialog({
      open: true,
      clientId: client.id,
      clientName: client.name
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await clientService.deleteClient(deleteDialog.clientId);
      
      // Refresh the current page
      fetchClients();
      
      showNotification(
        `Client ${deleteDialog.clientName} deleted successfully`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting client:", error);
      showNotification(
        error.message || "Failed to delete client", 
        "error"
      );
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
        currentPage={pagination.page + 1} // Convert 0-based to 1-based for display
        pageSize={pagination.pageSize}
        onPageChange={handlePageChange} // This receives 1-based index from DataTable
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