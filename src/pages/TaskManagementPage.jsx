import React, { useState, useEffect } from 'react';
import { Filter, AlertTriangle, ArrowLeft, Plus, Calendar, Edit, Trash2, UserCheck, Globe, CheckCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import CreateTaskModal from '../Components/Employes/CreateTaskModal';
import EditTaskModal from '../Components/Employes/EditTaskModal';
import employeeService from '../services/employeeService';
import calendarService from '../services/calanderService';

export default function TaskManagementPage({ employeeId }) {
  const { id } = useParams();
  const [selectedEmployee, setSelectedEmployee] = useState(id ? Number(id) : employeeId || 1);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [filter, setFilter] = useState({
    status: 'all',
    overdue: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedEmployee, setAssignedEmployee] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // New task template
  const newTaskTemplate = {
    title: "",
    description: "",
    status: "PENDING",
    dueDate: "",
    startTime: null,
  };

  const [formData, setFormData] = useState(newTaskTemplate);

  useEffect(() => {
    if (employeeId) {
      setSelectedEmployee(employeeId);
    }
  }, [employeeId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      // Fetch employee data
      const employeeData = await employeeService.getEmployeeById(selectedEmployee);
      setAssignedEmployee(employeeData);
      
      // Convert userId to integer and store it
      const userId = parseInt(employeeData.userId, 10);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }
      setCurrentUserId(userId);
      
      console.log('Fetching tasks for user ID:', userId);
      const tasksData = await employeeService.getEmployeeTasks(userId);
      setTasks(tasksData);
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedEmployee]);

  useEffect(() => {
    filterTasks();
  }, [tasks, filter, selectedEmployee]);

  const filterTasks = () => {
    let filtered = tasks;

    if (filter.status !== 'all') {
      filtered = filtered.filter(task => task.status === filter.status);
    }

    if (filter.overdue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(task => {
        const dueDateObj = new Date(task.dueDate);
        return dueDateObj < today && task.status !== "COMPLETED";
      });
    }

    setFilteredTasks(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState(null);

  const handleCreateTask = async () => {
    try {
      setIsCreatingTask(true);
      setCreateTaskError(null);

      const taskData = {
            title: formData.title,
            description: formData.description,
            type: 'TASK', // default
            status: formData.status || 'PENDING', // default to PENDING
            startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
            dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
            location: null, // empty
            global: false, // default
            assignedUserIds: currentUserId ? [currentUserId] : [] // from current user
            };
      
      await calendarService.createEvent(taskData);
      await fetchTasks(); // Refresh tasks after creation
      
      // Show success alert
      setSuccessMessage('Task created successfully!');
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 5000);
      
      setFormData(newTaskTemplate);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create task:', err);
      setCreateTaskError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const [isEditingTask, setIsEditingTask] = useState(false);
const [editTaskError, setEditTaskError] = useState(null);

const handleEditTask = async () => {
  try {
    setIsEditingTask(true);
    setEditTaskError(null);

    const taskData = {
      title: formData.title,
      description: formData.description,
      type: 'TASK',
      status: formData.status || 'PENDING',
      startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      location: null,
      global: false,
      assignedUserIds: currentUserId ? [currentUserId] : []
    };

    await calendarService.updateEvent(currentTask.id, taskData);
    await fetchTasks();
    
    setSuccessMessage('Task updated successfully!');
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 5000);
    
    setIsEditModalOpen(false);
    setCurrentTask(null);
  } catch (err) {
    console.error('Failed to update task:', err);
    setEditTaskError(err.message || 'Failed to update task. Please try again.');
  } finally {
    setIsEditingTask(false);
  }
};


  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const handleDeleteTask = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      await calendarService.deleteEvent(currentTask.id);
      await fetchTasks(); // Refresh tasks after deletion
      
      // Set success message
      setSuccessMessage('Task deleted successfully!');
      setShowSuccessAlert(true);
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setIsDeleteModalOpen(false);
        setCurrentTask(null);
      }, 1000);
      
      // Auto-hide alert after 5 seconds
      setTimeout(() => setShowSuccessAlert(false), 5000);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setDeleteError(err.message || 'Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState(null);

  const handleToggleCompletion = async () => {
    try {
      setIsTogglingCompletion(true);
      setCompletionError(null);
      
      await calendarService.toggleTaskCompletion(currentTask.id);
      await fetchTasks(); // Refresh tasks after completion
      
      // Set success message and show alert
      setSuccessMessage(`Task "${currentTask.title}" marked as completed!`);
      setShowSuccessAlert(true);
      
      // Close modal
      setIsCompletionModalOpen(false);
      setCurrentTask(null);
      
      // Auto-hide alert after 5 seconds
      setTimeout(() => setShowSuccessAlert(false), 5000);
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      setCompletionError(err.message || 'Failed to update task status. Please try again.');
    } finally {
      setIsTogglingCompletion(false);
    }
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

  const openCompletionModal = (task) => {
    setCurrentTask(task);
    setIsCompletionModalOpen(true);
  };

  const resetAndOpenCreateModal = () => {
    setFormData({...newTaskTemplate, employeeId: selectedEmployee});
    setIsCreateModalOpen(true);
  };

  const renderStatusBadge = (status) => {
    const statusStyles = {
      "PENDING": "bg-gray-100 text-gray-800",
      "IN_PROGRESS": "bg-blue-100 text-blue-800",
      "COMPLETED": "bg-green-100 text-green-800",
      "CANCELLED": "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    );
  };

  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dueDate);
    return dueDateObj < today;
  };

  if (isLoading) {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );
}

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
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
                <h1 className="text-lg font-bold">Task Management - {assignedEmployee?.firstName} {assignedEmployee?.lastName}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetAndOpenCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
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
              Filters
            </h3>
          </div>
          <div className="px-4 py-4 sm:px-6 flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md"
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
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
                  Overdue Tasks
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              All Tasks
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Global
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <TaskRow 
                      key={task.id}
                      task={task}
                      openEditModal={openEditModal}
                      openDeleteModal={openDeleteModal}
                      openCompletionModal={openCompletionModal}
                      renderStatusBadge={renderStatusBadge}
                      isTaskOverdue={isTaskOverdue}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No tasks found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleCreateTask}
        assignedEmployee={assignedEmployee}
        setFormData={setFormData}
        currentUserId={currentUserId}
        isSubmitting={isCreatingTask}
        error={createTaskError}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleEditTask}
        assignedEmployee={assignedEmployee}
        isSubmitting={isEditingTask}
        error={editTaskError}
      />

      {/* Delete Task Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Task
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this task? This action cannot be undone.
                      </p>
                      {deleteError && (
                        <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {isCompletionModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Mark Task as Completed
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to mark "{currentTask?.title}" as completed?
                      </p>
                      {completionError && (
                        <p className="mt-2 text-sm text-red-600">{completionError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  onClick={handleToggleCompletion}
                  disabled={isTogglingCompletion}
                >
                  {isTogglingCompletion ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : 'Mark as Completed'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsCompletionModalOpen(false);
                    setCompletionError(null);
                  }}
                  disabled={isTogglingCompletion}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, openEditModal, openDeleteModal, openCompletionModal, renderStatusBadge, isTaskOverdue }) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  return (
    <tr key={task.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{task.title}</div>
      </td>
      <td className="px-6 py-4">
        <div 
          className={`text-sm text-gray-500 max-w-xs ${showFullDescription ? '' : 'truncate'} cursor-pointer`}
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {task.description}
          {!showFullDescription && task.description.length > 50 && (
            <span className="text-blue-500"> ...</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {renderStatusBadge(task.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`flex items-center text-sm ${isTaskOverdue(task.dueDate) && task.status !== "COMPLETED" ? 'text-red-600' : 'text-gray-500'}`}>
          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
          {new Date(task.dueDate).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {task.startTime ? (
            new Date(task.startTime).toLocaleDateString()
          ) : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          {task.global ? (
            <Globe className="h-5 w-5 text-blue-500" />
          ) : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-2">
          {task.status !== 'COMPLETED' && (
            <button
              onClick={() => openCompletionModal(task)}
              className="text-green-600 hover:text-green-900"
              title="Mark as completed"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => openEditModal(task)}
            className="text-cyan-600 hover:text-cyan-900"
            title="Edit task"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => openDeleteModal(task)}
            className="text-red-600 hover:text-red-900"
            title="Delete task"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}