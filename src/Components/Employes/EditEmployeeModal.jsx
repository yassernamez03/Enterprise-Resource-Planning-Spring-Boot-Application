import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

export default function EditEmployeeModal({ isOpen, onClose, employee, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    role: '',
    status: '',
  });

  // Populate form when employee data is available
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        age: employee.age || '',
        role: employee.role || '',
        status: employee.status || '',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // In the EditEmployeeModal component:

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.put(`/api/employees/${employee.id}`, formData);
    onSave(response.data);
    onClose();
  } catch (err) {
    // Handle error
  }
};

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800">Modifier un employé</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        {/* Current info summary box */}
        <div className="mx-6 mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-700">Informations actuelles</h4>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div className="text-gray-500">Nom:</div>
                <div className="font-medium text-gray-800">{employee.name}</div>
                
                <div className="text-gray-500">Rôle:</div>
                <div className="font-medium text-gray-800">{employee.role}</div>
                
                <div className="text-gray-500">Statut:</div>
                <div className="font-medium text-gray-800">
                  <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    employee.status === 'ACTIF' ? 'bg-green-100 text-green-800' :
                    employee.status === 'EN_CONGÉ' ? 'bg-yellow-100 text-yellow-800' :
                    employee.status === 'EN_PÉRIODE D\'ESSAI' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {employee.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Âge
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Sélectionner un rôle</option>
                  <option value="Développeur">Développeur</option>
                  <option value="Designer">Designer</option>
                  <option value="Manager">Manager</option>
                  <option value="Analyste">Analyste</option>
                  <option value="RH">RH</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Sélectionner un statut</option>
                  <option value="ACTIF">ACTIF</option>
                  <option value="EN_CONGÉ">EN_CONGÉ</option>
                  <option value="RADIÉ">RADIÉ</option>
                  <option value="EN_PÉRIODE D'ESSAI">EN_PÉRIODE D'ESSAI</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="border-t px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}