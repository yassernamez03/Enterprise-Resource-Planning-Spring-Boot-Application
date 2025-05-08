import { useState, useEffect } from 'react';
import { Search, UserRound, Filter, MoreHorizontal, Edit2, Trash2, Eye, ArrowLeft, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import EditEmployeeModal from '../components/Employes/EditEmployeeModal';
import CreateEmployeeModal from '../components/Employes/CreateEmployeeModal';
import { Link } from 'react-router-dom';
import employeeServices from '../services/employeeService'; // Import the services

export default function EmployeeManagement() {
const [employees, setEmployees] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [statusFilter, setStatusFilter] = useState('Tous');
const [roleFilter, setRoleFilter] = useState('Tous');
const [searchTerm, setSearchTerm] = useState('');
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
const [currentEmployee, setCurrentEmployee] = useState(null);
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

// Pagination state
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 25; // You can adjust this value as needed

// Fetch employees data when component mounts
useEffect(() => {
    fetchEmployees();
}, []);

const fetchEmployees = async () => {
    try {
    setLoading(true);
    const data = await employeeServices.getAllEmployees();
    
    // Ensure data is an array
    if (Array.isArray(data)) {
        setEmployees(data);
    } else {
        console.error('API did not return an array:', data);
        setEmployees([]);
        setError('Format de données incorrect reçu de l\'API.');
    }
    
    } catch (err) {
    console.error('Failed to fetch employees:', err);
    setEmployees([]); // Ensure employees is always an array
    setError('Une erreur est survenue lors du chargement des employés.');
    } finally {
    setLoading(false);
    }
};

const filteredEmployees = employees.filter(employee => {
    const matchesStatus = statusFilter === 'Tous' || employee.status === statusFilter;
    const matchesRole = roleFilter === 'Tous' || employee.role === roleFilter;
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesRole && matchesSearch;
});

// Calculate pagination
const indexOfLastEmployee = currentPage * itemsPerPage;
const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

// Get unique roles and statuses for filters
const allRoles = ['Tous', ...new Set(employees.map(e => e.role))];
const allStatuses = ['Tous', ...new Set(employees.map(e => e.status))];

const handleDelete = async (id) => {
    try {
    // Call delete API here if needed
    await employeeServices.deleteEmployee(id);
    
    // For now, just updating the local state
    // setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) {
    console.error('Failed to delete employee:', err);
    // Handle error (show message, etc.)
    }
};

const handleEditClick = (employee) => {
    setCurrentEmployee(employee);
    setIsEditModalOpen(true);
};

const handleEmployeeCreated = (newEmployee) => {
    setEmployees([...employees, newEmployee]);
};

const handleSaveEmployee = (updatedEmployee) => {
    setEmployees(
    employees.map((emp) => 
        emp.id === updatedEmployee.id ? updatedEmployee : emp
    )
    );
};

const nextPage = () => {
    if (currentPage < totalPages) {
    setCurrentPage(currentPage + 1);
    }
};

const prevPage = () => {
    if (currentPage > 1) {
    setCurrentPage(currentPage - 1);
    }
};

const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
};

return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                <Link to="/" className="flex items-center">
                <button className="p-2 rounded-lg hover:bg-gray-100 mr-2">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                </Link>
                <h1 className="text-lg font-bold">Ressources humaines</h1>
            </div>
            </div>
            <div className="flex items-center space-x-2">
            <div className="bg-gray-100 rounded-full p-2 text-gray-500">
                <UserRound size={20} />
            </div>
            </div>
        </div>
        </div>
    </header>
    
    <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Interface de Gestion des Employés</h1>
        <button 
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
            onClick={() => setIsCreateModalOpen(true)}
        >
            <Plus size={18} className="mr-1" />
            Ajouter un employé
        </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            {/* Champ de recherche */}
            <div className="flex flex-col w-full md:w-64">
            <label className="mb-1 text-sm font-medium text-gray-700">Recherche</label>
            <div className="relative">
                <input
                type="text"
                placeholder="Rechercher un employé..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            </div>

            {/* Filtres (Statut & Rôle) */}
            <div className="flex flex-wrap gap-3">
            {/* Statut */}
            <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Filtrer par statut</label>
                <div className="relative">
                <select
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    {allStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            {/* Rôle */}
            <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Filtrer par rôle</label>
                <div className="relative">
                <select
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    {allRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                    ))}
                </select>
                <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
            </div>
            </div>
        </div>

        {/* Loading state */}
        {loading && (
            <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
            <p className="mt-2 text-gray-600">Chargement des données...</p>
            </div>
        )}

        {/* Error state */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <p>{error}</p>
            <button 
                onClick={fetchEmployees} 
                className="text-red-700 underline font-medium mt-2"
            >
                Réessayer
            </button>
            </div>
        )}
        
        {/* Table - Only show when not loading and no error */}
        {!loading && !error && (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {currentEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                            {employee.imageUrl ? (
                            <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={employee.imageUrl}
                                alt={employee.name}
                            />
                            ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserRound size={20} className="text-blue-500" />
                            </div>
                            )}
                        </div>
                        <div className="ml-4">
                            <Link to={`/TaskManagement/${employee.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {employee.name}
                            </Link>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'Actif' ? 'bg-green-100 text-green-800' :
                        employee.status === 'En congé' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                        }`}>
                        {employee.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                        <button 
                            className="p-1 rounded-full hover:bg-yellow-50"
                            onClick={() => handleEditClick(employee)}
                        >
                            <Edit2 size={18} className="text-yellow-500" />
                        </button>
                        <button 
                            className="p-1 rounded-full hover:bg-red-50"
                            onClick={() => {
                            setSelectedEmployeeId(employee.id);
                            setIsDeleteModalOpen(true);
                            }}
                        >
                            <Trash2 size={18} className="text-red-500" />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        
        {!loading && !error && filteredEmployees.length === 0 && (
            <div className="text-center py-10">
            <p className="text-gray-500">Aucun employé ne correspond à vos critères de recherche.</p>
            </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && filteredEmployees.length > 0 && (
            <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500">
                Affichage de {indexOfFirstEmployee + 1} à {Math.min(indexOfLastEmployee, filteredEmployees.length)} sur {filteredEmployees.length} employés
            </div>
            <div className="flex space-x-1">
                <button 
                onClick={prevPage} 
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                <ChevronLeft size={20} />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <button
                    key={number}
                    onClick={() => goToPage(number)}
                    className={`px-3 py-1 rounded-md ${
                    currentPage === number 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {number}
                </button>
                ))}
                
                <button 
                onClick={nextPage} 
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                <ChevronRight size={20} />
                </button>
            </div>
            </div>
        )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Statuts</h3>
            </div>
            <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Actifs</span>
                <span className="text-sm font-medium">{employees.filter(e => e.status === 'Actif').length}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">En congé</span>
                <span className="text-sm font-medium">{employees.filter(e => e.status === 'En congé').length}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inactifs</span>
                <span className="text-sm font-medium">{employees.filter(e => e.status === 'Inactif').length}</span>
            </div>
            </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Rôles</h3>
            </div>
            <div>
            {allRoles.filter(role => role !== 'Tous').map(role => (
                <div key={role} className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{role}</span>
                <span className="text-sm font-medium">{employees.filter(e => e.role === role).length}</span>
                </div>
            ))}
            </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">Actions rapides</h3>
            </div>
            <div className="space-y-3">
            <button 
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                onClick={() => fetchEmployees()} // Added refresh functionality
            >
                Rafraîchir la liste
            </button>
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors">
                Exporter la liste
            </button>
            </div>
        </div>
        </div>

        {/* Modals */}
        <EditEmployeeModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employee={currentEmployee}
        onSave={handleSaveEmployee}
        />

        <CreateEmployeeModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEmployeeCreated={handleEmployeeCreated}
        />

        {/* Delete Employee Modal */}
        {isDeleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Supprimer l'employé
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.
                        </p>
                    </div>
                    </div>
                </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                    handleDelete(selectedEmployeeId);
                    setIsDeleteModalOpen(false);
                    setSelectedEmployeeId(null);
                    }}
                >
                    Supprimer
                </button>
                <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setIsDeleteModalOpen(false)}
                >
                    Annuler
                </button>
                </div>
            </div>
            </div>
        </div>
        )}
    </main>
    </div>
);
}