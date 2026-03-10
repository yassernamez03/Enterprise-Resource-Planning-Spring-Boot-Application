import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import EventForm from './EventForm';
import { useAuth } from "../../context/AuthContext"; // Adjust the import path as necessary

const CreateEventButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
    const { user, logout } = useAuth();
    const currentUser = user || {}; // Fallback to an empty object if user is null
    // console.log("Current User:", currentUser);
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center transition-colors z-10"
      >
        <Plus className="h-6 w-6" />
        <span className="ml-1 mr-1 font-medium">Create New</span>
      </button>
      
      {isModalOpen && (
        <EventForm onClose={() => setIsModalOpen(false)} currentUser={currentUser.id}  />
      )}
    </>
  );
};

export default CreateEventButton;