import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trash2, Edit, Plus, Filter, AlertTriangle, Check, X, UserCheck, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

// Sample data - replace with your API calls
const initialTasks = [
{ 
    id: 1, 
    title: "Préparer le rapport mensuel", 
    description: "Compilation des données de vente du mois et préparation du rapport pour la direction", 
    status: "En cours", 
    priority: 3, 
    dueDate: "2025-05-05", 
    completedDate: null,
    completedByEmployee: false,
    employeeId: 1 
},
{ 
    id: 2, 
    title: "Réviser le contrat client", 
    description: "Révision des termes et conditions du contrat pour le client Dupont", 
    status: "À faire", 
    priority: 5, 
    dueDate: "2025-04-30", 
    completedDate: null,
    completedByEmployee: false,
    employeeId: 1 
},
{ 
    id: 3, 
    title: "Mise à jour de la documentation", 
    description: "Mettre à jour la documentation technique pour le nouveau produit", 
    status: "Terminé", 
    priority: 2, 
    dueDate: "2025-04-25", 
    completedDate: "2025-04-24",
    completedByEmployee: true,
    employeeId: 1 
},
{ 
    id: 4, 
    title: "Étude de marché", 
    description: "Analyser les tendances du marché pour le lancement du produit", 
    status: "En retard", 
    priority: 4, 
    dueDate: "2025-04-20", 
    completedDate: null,
    completedByEmployee: false,
    employeeId: 1 
},
];

const employees = [
{ id: 1, name: "Mike Dubois" },
{ id: 2, name: "Sophie Martin" },
{ id: 3, name: "Thomas Leroy" },
];

export default function TaskManagement({ employeeId }) {
// If employeeId is passed as a prop, use it; otherwise, default to 1
const { id } = useParams(); // <== ici tu récupères l'id depuis l'URL
employeeId = Number(id); // Convertir en nombre si besoin
console.log("Employee ID from URL:", employeeId); // Debugging line

const [selectedEmployee, setSelectedEmployee] = useState(employeeId || 1);
const [tasks, setTasks] = useState(initialTasks);
const [filteredTasks, setFilteredTasks] = useState([]);
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [currentTask, setCurrentTask] = useState(null);
const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    overdue: false,
});

// Trouve l’employé correspondant à l’ID 
const assignedEmployee = employees.find(emp => emp.id === employeeId);

// New task template
const newTaskTemplate = {
    id: null,
    title: "",
    description: "",
    status: "À faire",
    priority: 1,
    dueDate: "",
    completedDate: null,
    completedByEmployee: false,
    employeeId: selectedEmployee
};

// Form state for creating/editing tasks
const [formData, setFormData] = useState(newTaskTemplate);

// Update selected employee when employeeId prop changes
useEffect(() => {
    if (employeeId) {
    setSelectedEmployee(employeeId);
    }
}, [employeeId]);

// Apply filters when filter state changes
useEffect(() => {
    let filtered = tasks.filter(task => task.employeeId === selectedEmployee);

    if (filter.status !== 'all') {
    filtered = filtered.filter(task => task.status === filter.status);
    }

    if (filter.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === parseInt(filter.priority));
    }

    if (filter.overdue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(task => {
        const dueDateObj = new Date(task.dueDate);
        return dueDateObj < today && task.status !== "Terminé";
    });
    }

    setFilteredTasks(filtered);
}, [tasks, filter, selectedEmployee]);

// Form handlers
const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
    ...formData,
    [name]: value
    });
};

const handleCompletedByEmployeeChange = (e) => {
    const isCompleted = e.target.checked;
    setFormData({
    ...formData,
    completedByEmployee: isCompleted,
    completedDate: isCompleted ? new Date().toISOString().split('T')[0] : null,
    status: isCompleted ? "Terminé" : formData.status
    });
};

const handleCreateTask = () => {
    // Generate new ID (in real app, this would come from the backend)
    const newId = Math.max(...tasks.map(task => task.id), 0) + 1;
    
    const newTask = {
    ...formData,
    id: newId
    };
    
    setTasks([...tasks, newTask]);
    setIsCreateModalOpen(false);
    setFormData(newTaskTemplate);
};

const handleEditTask = () => {
    const updatedTasks = tasks.map(task => 
    task.id === formData.id ? formData : task
    );
    
    setTasks(updatedTasks);
    setIsEditModalOpen(false);
};

const handleDeleteTask = () => {
    const updatedTasks = tasks.filter(task => task.id !== currentTask.id);
    setTasks(updatedTasks);
    setIsDeleteModalOpen(false);
    setCurrentTask(null);
};

const openEditModal = (task) => {
    setCurrentTask(task);
    setFormData({...task});
    setIsEditModalOpen(true);
};

const openDeleteModal = (task) => {
    setCurrentTask(task);
    setIsDeleteModalOpen(true);
};

const resetAndOpenCreateModal = () => {
    setFormData({...newTaskTemplate, employeeId: selectedEmployee});
    setIsCreateModalOpen(true);
};

// Helper for rendering priority badges
const renderPriorityBadge = (priority) => {
    const colors = {
    1: "bg-gray-100 text-gray-800",
    2: "bg-blue-100 text-blue-800",
    3: "bg-yellow-100 text-yellow-800",
    4: "bg-orange-100 text-orange-800",
    5: "bg-red-100 text-red-800"
    };
    
    return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority]}`}>
        P{priority}
    </span>
    );
};

// Helper for rendering status badges
const renderStatusBadge = (status) => {
    const statusStyles = {
    "À faire": "bg-gray-100 text-gray-800",
    "En cours": "bg-blue-100 text-blue-800",
    "Terminé": "bg-green-100 text-green-800",
    "En retard": "bg-red-100 text-red-800"
    };
    
    return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status}
    </span>
    );
};

// Helper for checking if task is overdue
const isTaskOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dueDate);
    return dueDateObj < today;
};

return (
    <div className="bg-gray-50 min-h-screen">
    {/* Header */}
    <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="flex items-center w-full md:w-auto mb-4 md:mb-0">
                    <Link to="/Employee" className="flex items-center">
                        <button className="p-2 rounded-lg hover:bg-gray-100 mr-2">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                    </Link>
                    <h1 className="text-lg font-bold">Gestion des Tâches - {employees.find(e => e.id === selectedEmployee)?.name}</h1>
                </div>
            </div>
            <div className="flex items-center space-x-4">
            <button
                onClick={resetAndOpenCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700"
            >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Tâche
            </button>
            </div>
        </div>
        </div>
    </div>

    {/* Main Content */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtres
            </h3>
        </div>
        <div className="px-4 py-4 sm:px-6 flex flex-wrap gap-4">
            <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Statut
            </label>
            <select
                id="status-filter"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
            >
                <option value="all">Tous les statuts</option>
                <option value="À faire">À faire</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="En retard">En retard</option>
            </select>
            </div>
            <div>
            <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Priorité
            </label>
            <select
                id="priority-filter"
                name="priority"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                value={filter.priority}
                onChange={(e) => setFilter({...filter, priority: e.target.value})}
            >
                <option value="all">Toutes les priorités</option>
                <option value="1">P1</option>
                <option value="2">P2</option>
                <option value="3">P3</option>
                <option value="4">P4</option>
                <option value="5">P5</option>
            </select>
            </div>
            <div className="flex items-end">
            <label className="inline-flex items-center">
                <input
                type="checkbox"
                className="rounded border-gray-300 text-cyan-600 shadow-sm focus:border-cyan-300 focus:ring focus:ring-cyan-200 focus:ring-opacity-50 mt-1"
                checked={filter.overdue}
                onChange={(e) => setFilter({...filter, overdue: e.target.checked})}
                />
                <span className="ml-2 text-sm text-gray-700 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                Tâches en retard
                </span>
            </label>
            </div>
        </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
            Tâches de {employees.find(e => e.id === selectedEmployee)?.name}
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date limite
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Complété par
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                </th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                    <tr key={task.id} className={`hover:bg-gray-50 ${task.completedByEmployee ? 'opacity-70' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium text-gray-900 ${task.completedByEmployee ? 'line-through' : ''}`}>{task.title}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{task.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {renderPriorityBadge(task.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-sm ${isTaskOverdue(task.dueDate) && task.status !== "Terminé" ? 'text-red-600' : 'text-gray-500'}`}>
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {task.completedByEmployee ? (
                        <div className="flex items-center text-sm text-green-600">
                            <UserCheck className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            {task.completedDate && new Date(task.completedDate).toLocaleDateString()}
                        </div>
                        ) : (
                        <span className="text-sm text-gray-500">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                        <button
                            onClick={() => openEditModal(task)}
                            className="text-cyan-600 hover:text-cyan-900"
                        >
                            <Edit className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => openDeleteModal(task)}
                            className="text-red-600 hover:text-red-900"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucune tâche trouvée
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    </div>

    {/* Create Task Modal */}
    {isCreateModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Nouvelle Tâche
                    </h3>
                    <div className="mt-2 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Titre
                        </label>
                        <input
                        type="text"
                        name="title"
                        id="title"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        value={formData.title}
                        onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                        </label>
                        <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                        value={formData.description}
                        onChange={handleInputChange}
                        ></textarea>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Date limite
                        </label>
                        <input
                            type="date"
                            name="dueDate"
                            id="dueDate"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            value={formData.dueDate}
                            onChange={handleInputChange}
                        />
                        </div>
                        <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priorité
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                        >
                            <option value={1}>P1 - Très basse</option>
                            <option value={2}>P2 - Basse</option>
                            <option value={3}>P3 - Moyenne</option>
                            <option value={4}>P4 - Haute</option>
                            <option value={5}>P5 - Très haute</option>
                        </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Statut
                        </label>
                        <select
                            id="status"
                            name="status"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            <option value="À faire">À faire</option>
                            <option value="En cours">En cours</option>
                            <option value="Terminé">Terminé</option>
                            <option value="En retard">En retard</option>
                        </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Employé assigné
                            </label>
                            <p className="mt-1 text-sm text-gray-900 font-semibold">
                                {assignedEmployee ? assignedEmployee.name : 'Employé inconnu'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="completedByEmployee"
                            className="rounded border-gray-300 text-cyan-600 shadow-sm focus:border-cyan-300 focus:ring focus:ring-cyan-200 focus:ring-opacity-50"
                            checked={formData.completedByEmployee}
                            onChange={handleCompletedByEmployeeChange}
                        />
                        <span className="ml-2 text-sm text-gray-700">Marqué comme terminé par l'employé</span>
                        </label>
                        {formData.completedByEmployee && (
                        <div className="mt-2">
                            <label htmlFor="completedDate" className="block text-sm font-medium text-gray-700">
                            Date de complétion
                            </label>
                            <input
                            type="date"
                            name="completedDate"
                            id="completedDate"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            value={formData.completedDate}
                            onChange={handleInputChange}
                            />
                        </div>
                        )}
                    </div>
                    </div>
                </div>
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600">
                    <p>
                        To assign this task to multiple employees, use&nbsp;
                        <Link to="/calander_page" className="text-cyan-600 hover:underline">
                            the calendar
                        </Link>.
                    </p>
                </div>

                <div className="mt-3 sm:mt-0 sm:flex sm:space-x-3">
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:text-sm"
                        onClick={handleCreateTask}
                    >
                        Ajouter tâche
                    </button>
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:text-sm"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
        </div>
        </div>
    )}
        {/* Edit Task Modal */}
        {isEditModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Modifier la Tâche
                    </h3>
                    <div className="mt-2 space-y-4">
                        <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Titre
                        </label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            value={formData.title}
                            onChange={handleInputChange}
                        />
                        </div>
                        <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            value={formData.description}
                            onChange={handleInputChange}
                        ></textarea>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                            Date limite
                            </label>
                            <input
                            type="date"
                            name="dueDate"
                            id="dueDate"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                            value={formData.dueDate}
                            onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                            Priorité
                            </label>
                            <select
                            id="priority"
                            name="priority"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                            value={formData.priority}
                            onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                            >
                            <option value={1}>P1 - Très basse</option>
                            <option value={2}>P2 - Basse</option>
                            <option value={3}>P3 - Moyenne</option>
                            <option value={4}>P4 - Haute</option>
                            <option value={5}>P5 - Très haute</option>
                            </select>
                        </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Statut
                            </label>
                            <select
                            id="status"
                            name="status"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                            value={formData.status}
                            onChange={handleInputChange}
                            >
                            <option value="À faire">À faire</option>
                            <option value="En cours">En cours</option>
                            <option value="Terminé">Terminé</option>
                            <option value="En retard">En retard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Employé assigné
                            </label>
                            <p className="mt-1 text-sm text-gray-900 font-semibold">
                                {assignedEmployee ? assignedEmployee.name : 'Employé inconnu'}
                            </p>
                        </div>
                        </div>
                        <div>
                        <label className="flex items-center">
                            <input
                            type="checkbox"
                            name="completedByEmployee"
                            className="rounded border-gray-300 text-cyan-600 shadow-sm focus:border-cyan-300 focus:ring focus:ring-cyan-200 focus:ring-opacity-50"
                            checked={formData.completedByEmployee}
                            onChange={handleCompletedByEmployeeChange}
                            />
                            <span className="ml-2 text-sm text-gray-700">Marqué comme terminé par l'employé</span>
                        </label>
                        {formData.completedByEmployee && (
                            <div className="mt-2">
                            <label htmlFor="completedDate" className="block text-sm font-medium text-gray-700">
                                Date de complétion
                            </label>
                            <input
                                type="date"
                                name="completedDate"
                                id="completedDate"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                value={formData.completedDate}
                                onChange={handleInputChange}
                            />
                            </div>
                        )}
                        </div>
                    </div>
                    </div>
                </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleEditTask}
                >
                    Enregistrer les modifications
                </button>
                <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setIsEditModalOpen(false)}
                >
                    Annuler
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Delete Task Modal */}
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
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Supprimer la tâche
                        </h3>
                        <div className="mt-2">
                        <p className="text-sm text-gray-500">
                            Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action ne peut pas être annulée.
                        </p>
                        </div>
                    </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteTask}
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
        </div>
    );
    }
