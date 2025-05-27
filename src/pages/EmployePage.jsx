import { useState, useEffect } from 'react';
import { Search, UserRound, Filter, MoreHorizontal, Edit2, Trash2, Eye, ArrowLeft, Plus, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import employeeServices from '../services/employeeService';
import EditEmployeeModal from '../Components/Employes/EditEmployeeModal';
import CreateEmployeeModal from '../components/Employes/CreateEmployeeModal';

export default function EmployeeManagement() {
// State management
const [employees, setEmployees] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [statusFilter, setStatusFilter] = useState('All');
const [roleFilter, setRoleFilter] = useState('All');
const [searchTerm, setSearchTerm] = useState('');
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
const [currentEmployee, setCurrentEmployee] = useState(null);
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

const [isUpdating, setIsUpdating] = useState(false);
const [successMessage, setSuccessMessage] = useState('');
const [showSuccessAlert, setShowSuccessAlert] = useState(false);
const [isCreating, setIsCreating] = useState(false);
const [createSuccess, setCreateSuccess] = useState('');
const [showCreateSuccessAlert, setShowCreateSuccessAlert] = useState(false);
const [createError, setCreateError] = useState('');
const [showCreateErrorAlert, setShowCreateErrorAlert] = useState(false);
const [showErrorAlert, setShowErrorAlert] = useState(false);

// Fetch employees data
const fetchEmployees = async () => {
    try {
    setLoading(true);
    const data = await employeeServices.getAllEmployees();
    setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
    console.error('Fetch error:', err);
    setError('Failed to fetch employees');
    setShowErrorAlert(true);
    } finally {
    setLoading(false);
    }
};

useEffect(() => {
    fetchEmployees();
}, []);

// Filter and pagination logic
const filteredEmployees = employees.filter(employee => {
    const matchesStatus = statusFilter === 'All' || employee.status === statusFilter;
    const matchesRole = roleFilter === 'All' || employee.role === roleFilter;
    const matchesSearch = 
    employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone?.includes(searchTerm);
    return matchesStatus && matchesRole && matchesSearch;
});

// Pagination calculations
const indexOfLastEmployee = currentPage * itemsPerPage;
const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

// Employee actions
const handleDelete = async (id) => {
    try {
    await employeeServices.deleteEmployee(id);
    fetchEmployees();
    setSuccessMessage('Employee deleted successfully');
    setShowSuccessAlert(true);
    } catch (err) {
    console.error('Delete error:', err);
    setError('Failed to delete employee');
    setShowErrorAlert(true);
    }
};

const handleEditClick = (employee) => {
    setCurrentEmployee(employee);
    setIsEditModalOpen(true);
};

const handleSaveEmployee = (updatedEmployee, isSuccess, errorMessage = '') => {
if (isSuccess) {
    // Update the employees list
    setEmployees(employees.map(emp => 
    emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
    
    // Show success message
    setSuccessMessage('Employee updated successfully');
    setShowSuccessAlert(true);
    setIsEditModalOpen(false);
} else {
    // Show error message
    setError(errorMessage || 'Failed to update employee');
    setShowErrorAlert(true);
}
};

// Auto-dismiss success messages
useEffect(() => {
    if (showSuccessAlert) {
    const timer = setTimeout(() => setShowSuccessAlert(false), 5000);
    return () => clearTimeout(timer);
    }
}, [showSuccessAlert]);

useEffect(() => {
    if (showCreateSuccessAlert) {
    const timer = setTimeout(() => setShowCreateSuccessAlert(false), 5000);
    return () => clearTimeout(timer);
    }
}, [showCreateSuccessAlert]);

useEffect(() => {
    if (showCreateErrorAlert) {
    const timer = setTimeout(() => setShowCreateErrorAlert(false), 5000);
    return () => clearTimeout(timer);
    }
}, [showCreateErrorAlert]);

useEffect(() => {
    if (showErrorAlert) {
    const timer = setTimeout(() => setShowErrorAlert(false), 5000);
    return () => clearTimeout(timer);
    }
}, [showErrorAlert]);

// UI helpers
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US') : '-';
const formatSalary = (salary) => salary ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salary) : '-';

// Unique values for filters
const allRoles = ['All', ...new Set(employees.map(e => e.role))];
const allStatuses = ['All', ...new Set(employees.map(e => e.status))];

return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center">
                <button className="p-2 rounded-lg hover:bg-gray-100 mr-2">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
            </Link>
            <h1 className="text-lg font-bold">Human Resources</h1>
            </div>
        </div>
        </div>
    </header>

    <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Employee Management</h1>
        <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center"
        >
            <Plus size={18} className="mr-1" />
            Add Employee
        </button>
        </div>

        {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Status</h3>
                {['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'PROBATION'].map(status => (
                <div key={status} className="flex justify-between py-1">
                    <span>{status}</span>
                    <span className="font-medium">
                    {employees.filter(e => e.status === status).length}
                    </span>
                </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Roles</h3>
                {allRoles.filter(r => r !== 'All').map(role => (
                <div key={role} className="flex justify-between py-1">
                    <span>{role}</span>
                    <span className="font-medium">
                    {employees.filter(e => e.role === role).length}
                    </span>
                </div>
                ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Actions</h3>
                <button 
                onClick={fetchEmployees}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg mb-2"
                >
                Refresh
                </button>
            </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="w-full md:w-64">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Employees</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                    type="text"
                    id="search"
                    placeholder="Search by name, email or phone..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                </div>

                <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                        id="status-filter"
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {allStatuses.map(status => (
                        <option key={status} value={status}>
                            {status === 'ACTIVE' ? 'Active' : 
                            status === 'ON_LEAVE' ? 'On Leave' : 
                            status === 'TERMINATED' ? 'Terminated' : 
                            status === 'PROBATION' ? 'Probation' : 
                            status}
                        </option>
                        ))}
                    </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                    <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                        id="role-filter"
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        {allRoles.map(role => (
                        <option key={role} value={role}>
                            {role === 'Developer' ? 'Developer' : 
                            role === 'Designer' ? 'Designer' : 
                            role === 'Manager' ? 'Manager' : 
                            role === 'Analyst' ? 'Analyst' : 
                            role === 'HR' ? 'HR' : 
                            role === 'Sales' ? 'Sales' : 
                            role}
                        </option>
                        ))}
                    </select>
                    </div>
                </div>
                </div>
            </div>
            
                {/* Loading States */}
                {(loading || isUpdating || isCreating) && (
                    <div className="text-center py-10">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
                        <p className="mt-2 text-gray-600">
                            {isUpdating ? 'Updating employee...' : 
                            isCreating ? 'Creating employee...' : 'Loading employees...'}
                        </p>
                    </div>
                )}

            {/* Employee Table */}
            {!loading && !isUpdating && !isCreating && !error && !createError && (
                <>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentEmployees.length > 0 ? (
                        currentEmployees.map((employee) => (
                            <tr key={employee.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                {employee.imageUrl ? (
                                    <img className="h-10 w-10 rounded-full mr-3" src={employee.imageUrl} alt={`${employee.firstName} ${employee.lastName}`} />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                    <UserRound className="text-blue-500" />
                                    </div>
                                )}
                                <div>
                                    <div className="ml-4">
                                    <Link to={`/TaskManagement/${employee.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                        {employee.firstName} {employee.lastName}
                                    </Link>
                                    <div className="text-sm text-gray-500">{formatDate(employee.dateOfBirth)}</div>
                                    </div>
                                </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>{employee.email}</div>
                                <div className="text-sm text-gray-500">{employee.phone || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>{employee.position}</div>
                                <div className="text-sm text-gray-500">{employee.role}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {formatDate(employee.hireDate)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {formatSalary(employee.salary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                                }`}>
                                {employee.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleEditClick(employee)}
                                    className="text-blue-600 hover:text-blue-900"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => {
                                    setSelectedEmployeeId(employee.id);
                                    setIsDeleteModalOpen(true);
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    <Trash2 size={18} />
                                </button>
                                </div>
                            </td>
                            </tr>
                        ))
                        ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                            No employees found
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredEmployees.length > 0 && (
                    <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-500">
                        Showing {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length}
                    </div>
                    <div className="flex space-x-1">
                        <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md disabled:opacity-50"
                        >
                        <ChevronLeft size={20} />
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        return (
                            <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded-md ${
                                currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                            }`}
                            >
                            {pageNum}
                            </button>
                        );
                        })}

                        <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md disabled:opacity-50"
                        >
                        <ChevronRight size={20} />
                        </button>
                    </div>
                    </div>
                )}
                </>
            )}
            </div>

        {/* Success Alert */}
        {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
            <div className="rounded-md bg-green-50 p-4 shadow-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                    {successMessage}
                </p>
                </div>
                <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                    <button
                    type="button"
                    className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                    onClick={() => setShowSuccessAlert(false)}
                    >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Create Success Alert */}
        {showCreateSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
            <div className="rounded-md bg-green-50 p-4 shadow-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                    {createSuccess}
                </p>
                </div>
                <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                    <button
                    type="button"
                    className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                    onClick={() => setShowCreateSuccessAlert(false)}
                    >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Error Alert */}
        {showErrorAlert && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
            <div className="rounded-md bg-red-50 p-4 shadow-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                    {error}
                </p>
                </div>
                <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                    <button
                    type="button"
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    onClick={() => setShowErrorAlert(false)}
                    >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Create Error Alert */}
        {showCreateErrorAlert && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn">
            <div className="rounded-md bg-red-50 p-4 shadow-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                    {createError}
                </p>
                </div>
                <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                    <button
                    type="button"
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                    onClick={() => setShowCreateErrorAlert(false)}
                    >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                </div>
            </div>
            </div>
        </div>
        )}

        {/* Loading States */}
        {(loading || isUpdating || isCreating) && (
        <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-500"></div>
            <p className="mt-2 text-gray-600">
            {isUpdating ? 'Updating employee...' : 
            isCreating ? 'Creating employee...' : 'Loading employees...'}
            </p>
        </div>
        )}

        {/* Modals */}
        <EditEmployeeModal 
            isOpen={isEditModalOpen}
            onClose={() => {
                setIsEditModalOpen(false);
                setError(null);
            }}
            employee={currentEmployee}
            onEmployeeUpdated={handleSaveEmployee}
        />

        <CreateEmployeeModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
            setIsCreateModalOpen(false);
            setCreateError('');
        }}
        onEmployeeCreated={(newEmployee) => {
            setIsCreating(true);
            try {
            setEmployees(prev => [...prev, newEmployee]);
            setCreateSuccess('Employee created successfully');
            setShowCreateSuccessAlert(true);
            setIsCreateModalOpen(false);
            } catch (err) {
            console.error('Error adding new employee:', err);
            setCreateError('Failed to add new employee');
            setShowCreateErrorAlert(true);
            } finally {
            setIsCreating(false);
            }
        }}
        allEmployees={employees}
        assignedUserIds={employees
            .filter(emp => emp.userId)
            .map(emp => emp.userId)
        }
        />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
                <div className="flex items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Delete Employee</h3>
                    <div className="mt-2">
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete this employee? This action cannot be undone.
                    </p>
                    </div>
                </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                    handleDelete(selectedEmployeeId);
                    setIsDeleteModalOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                    Delete
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