// components/AccountPage.js
import React from 'react';
import { ChevronLeft } from 'lucide-react';

const AccountPage = ({ currentChat, darkMode, setShowAccountPage }) => {
  if (!currentChat) return null;
  
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center">
        <button 
          className="p-2 rounded-full hover:bg-gray-200"
          onClick={() => setShowAccountPage(false)}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-medium ml-4">Account Details</h2>
      </div>
      
      <div className="flex flex-col items-center justify-center p-8">
        <div className={`bg-${currentChat.id === 1 ? 'blue' : currentChat.id === 2 ? 'green' : currentChat.id === 3 ? 'purple' : currentChat.id === 4 ? 'red' : 'yellow'}-500 rounded-full h-24 w-24 flex items-center justify-center text-white font-bold text-3xl mb-4`}>
          {currentChat.avatar}
        </div>
        
        <h2 className="text-xl font-bold mb-2">{currentChat.name}</h2>
        <p className="text-gray-600 mb-6">Online</p>
        
        <div className="w-full max-w-md space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Contact Info</h3>
            <p className="text-gray-600">Email: {currentChat.name.toLowerCase().replace(' ', '.')}@example.com</p>
            <p className="text-gray-600">Phone: +1 (555) 123-4567</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Shared Media</h3>
            <p className="text-gray-600">No shared media</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;