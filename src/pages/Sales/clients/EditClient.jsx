import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ClientForm from "./components/ClientForm"
import { useAppContext } from "../../../context/Sales/AppContext"
import { clientService } from "../../../services/Sales/clientService";

// Mock client for development
const MOCK_CLIENT = {
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
}

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useAppContext();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        const data = await clientService.getClient(id);
        setClient(data);
      } catch (error) {
        console.error("Error fetching client:", error);
        showNotification("Failed to load client details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id]);

  const handleSubmit = async data => {
    if (!client) return;

    try {
      setSaving(true);
      await clientService.updateClient(client.id, data);
      showNotification("Client updated successfully", "success");
      navigate(`/sales/clients/${client.id}`);
    } catch (error) {
      console.error("Error updating client:", error);
      showNotification(error.message || "Failed to update client", "error");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/sales/clients/${client?.id || ""}`)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>

        <div className="bg-white rounded-lg shadow-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-700">Client not found</h2>
        <button
          onClick={() => navigate("/sales/clients")}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Clients
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-2">
        <button
          onClick={handleCancel}
          className="inline-flex items-center mr-3 text-gray-600 hover:text-primary-600"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Client</h1>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <p className="text-gray-600">
          Update the client's information and click Save to apply changes.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <ClientForm
          initialData={client}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </div>
    </div>
  )
}

export default EditClient
