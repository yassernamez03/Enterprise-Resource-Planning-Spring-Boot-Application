import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import ClientForm from "./components/ClientForm"
import { useAppContext } from "../../../context/Sales/AppContext"

const CreateClient = () => {
  const navigate = useNavigate()
  const { showNotification } = useAppContext()

  const [loading, setLoading] = useState(false)

  const handleSubmit = async data => {
    try {
      setLoading(true)

      // In a real app, call the create API
      // const newClient = await createClient(data);
      // navigate(`/clients/${newClient.id}`);

      // For development, just wait a bit then redirect
      setTimeout(() => {
        showNotification("Client created successfully", "success")
        navigate("/sales/clients")
      }, 1000)
    } catch (error) {
      console.error("Error creating client:", error)
      showNotification("Failed to create client", "error")
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate("/sales/clients")
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
        <h1 className="text-2xl font-bold text-gray-800">Create New Client</h1>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <p className="text-gray-600">
          Enter the client's details to create a new client record.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6">
        <ClientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default CreateClient
