import React, { useState } from 'react';
import { ArrowLeft, CheckSquare, Filter, Search } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';
import EmptyState from '../Common/EmptyState';

const AllTasksView = ({ onBack, onTaskSelect, onStatusChange, tasks }) => {
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline'); // deadline, priority, title
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  // Filter tasks based on status and search query
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'pending' && task.status === 'pending') ||
      (filter === 'completed' && task.status === 'completed');
    
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (sortBy === 'priority') {
      const priorityValues = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityValues[a.priority] - priorityValues[b.priority];
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Handle task status toggle with loading state
  const handleStatusToggle = (e, taskId) => {
    e.stopPropagation(); // Prevent the click from bubbling up to the task container
    setLoadingTaskId(taskId);
    
    // Add a small delay for better UX
    setTimeout(async () => {
      try {
        await onStatusChange(taskId);
      } finally {
        setLoadingTaskId(null);
      }
    }, 300);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-3 p-2 rounded-full hover:bg-slate-100"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-xl font-medium text-slate-800">All Tasks</h2>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
        <div className="flex space-x-2 items-center">
          <Filter size={16} className="text-slate-500" />
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="border-none text-sm text-slate-600 focus:ring-0 focus:outline-none bg-slate-50 rounded p-1"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <span className="text-slate-400">|</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="border-none text-sm text-slate-600 focus:ring-0 focus:outline-none bg-slate-50 rounded p-1"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
        
        <div className="w-full sm:w-auto relative">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>
      
      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <EmptyState 
            icon={<CheckSquare size={40} className="text-slate-300" />}
            title="No tasks found"
            message={searchQuery ? "Try adjusting your search or filters" : "You don't have any tasks yet"}
          />
        ) : (
          sortedTasks.map(task => (
            <div 
              key={task.id} 
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition duration-150"
              onClick={() => onTaskSelect(task)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="mt-1 mr-3">
                    <button
                      onClick={(e) => handleStatusToggle(e, task.id)}
                      className="p-1 rounded-full hover:bg-slate-200 focus:outline-none transition duration-150"
                      disabled={loadingTaskId === task.id}
                    >
                      {loadingTaskId === task.id ? (
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                      ) : (
                        <CheckSquare 
                          size={18} 
                          className={task.status === 'completed' ? "text-green-500" : "text-slate-400"} 
                        />
                      )}
                    </button>
                  </div>
                  <div>
                    <p className={`text-slate-800 font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex flex-wrap items-center mt-1 text-sm text-slate-500">
                      <span className="mr-3">Due: {task.deadline}</span>
                      <span className="mr-3">•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        task.category === 'Finance' ? 'bg-blue-100 text-blue-800' : 
                        task.category === 'Legal' ? 'bg-purple-100 text-purple-800' : 
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.priority === 'High' ? 'bg-red-100 text-red-800' : 
                  task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
              </div>
              
              {/* Preview of description */}
              <div className="mt-2 pl-8">
                <p className="text-sm text-slate-500 line-clamp-2">
                  {task.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AllTasksView;