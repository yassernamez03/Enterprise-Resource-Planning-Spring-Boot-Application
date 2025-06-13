import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ClientForm from "./components/ClientForm"
import { useAppContext } from "../../../context/Sales/AppContext"
import { clientService } from "../../../services/Sales/clientService";
import { decodeId } from "../../../utils/hashids";

const EditClient = () => {
  const { id: hashId } = useParams(); // Get the hashed ID from URL
  const navigate = useNavigate();
  const { showNotification } = useAppContext();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actualId, setActualId] = useState(null); // Store the decoded integer ID

  useEffect(() => {
    if (hashId) {
      // Decode the hash to get the actual integer ID
      const decodedId = decodeId(hashId);
      
      if (!decodedId) {
        showNotification("Invalid client ID", "error");
        navigate("/sales/clients");
        return;
      }
      
      setActualId(decodedId);
      fetchClient(decodedId); // Use the decoded integer ID for API call
    }
  }, [hashId, navigate, showNotification]);

  const fetchClient = async (clientId) => {
    try {
      setLoading(true);
      const data = await clientService.getClient(clientId); // API uses integer ID
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
      showNotification("Failed to load client details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async data => {
    if (!client || !actualId) return;

    try {
      setSaving(true);
      await clientService.updateClient(actualId, data); // Use integer ID for API
      showNotification("Client updated successfully", "success");
      navigate(`/sales/clients/${hashId}`); // Use the original hash for navigation
    } catch (error) {
      console.error("Error updating client:", error);
      showNotification(error.message || "Failed to update client", "error");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/sales/clients/${hashId}`) // Use the original hash for navigation
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
