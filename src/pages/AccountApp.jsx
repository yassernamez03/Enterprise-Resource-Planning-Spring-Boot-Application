import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Key,
  CheckSquare,
  ChevronRight,
  Edit2,
  Calendar,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import accountService from "../services/accountService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../Components/Common/LoadingSpinner";

// Import components
import EditAccountDetails from "../Components/Account/EditAccountDetails";
import AllTasksView from "../Components/Account/AllTasksView";
import TaskDetailView from "../Components/Account/TaskDetailView";

const AccountPage = () => {
  const { user: authUser } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  const navigate = useNavigate();

  // Add state to track the current view
  const [currentView, setCurrentView] = useState("main"); // main, editAccount, allTasks, taskDetail
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [user, setUser] = useState({
    name: "",
    email: "",
    avatar: "",
  });

  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);

  // Transform tasks data from API to expected format
  const transformTasks = (apiTasks) => {
    if (!Array.isArray(apiTasks)) return [];

    return apiTasks.map((task) => ({
      id: task.id,
      title: task.title || "Untitled Task",
      description: task.description || "",
      deadline: task.dueDate
        ? new Date(task.dueDate).toLocaleDateString()
        : "No deadline",
      priority: task.priority || "Medium",
      status: task.status === "COMPLETED" ? "completed" : "pending",
      category: task.category || "General",
      isLoading: false,
    }));
  };

  // Transform events data from API to expected format
  const transformEvents = (apiEvents) => {
    if (!Array.isArray(apiEvents)) return [];

    const now = new Date();

    return apiEvents
      .map((event) => ({
        id: event.id,
        title: event.title || "Untitled Event",
        description: event.description || "",
        date: event.startTime
          ? new Date(event.startTime).toLocaleDateString()
          : "",
        time: event.startTime
          ? new Date(event.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        type: event.type?.toLowerCase() || "event",
        startTime: event.startTime ? new Date(event.startTime) : null,
      }))
      .filter((event) => event.startTime && event.startTime > now) // Only future events
      .sort((a, b) => a.startTime - b.startTime); // Sort by date, earliest first
  };

  // Fetch user data - using useCallback to prevent excessive re-renders
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get user profile
      const profileData = await accountService.getProfile();

      setUser({
        name: profileData.fullName || profileData.name || "",
        email: profileData.email || "",
        avatar: profileData.avatarUrl || profileData.avatar || "",
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data. Please try again.");
      showErrorToast("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [showErrorToast]);

  // Fetch tasks separately
  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const tasksResponse = await accountService.getTasks();
      const transformedTasks = transformTasks(tasksResponse);
      setTasks(transformedTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      showErrorToast("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }, [showErrorToast]);

  // Fetch events separately
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const eventsResponse = await accountService.getEvents();
      const transformedEvents = transformEvents(eventsResponse);
      setEvents(transformedEvents);
    } catch (err) {
      console.error("Error fetching events:", err);
      showErrorToast("Failed to load events");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [showErrorToast]);

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
    fetchTasks();
    fetchEvents();
  }, [fetchUserData, fetchTasks, fetchEvents]);

  // Handler for account data update from EditAccountDetails
  const handleSaveAccountDetails = (updatedData) => {
    setUser({
      ...user,
      ...updatedData,
    });
    setCurrentView("main");
    showSuccessToast("Your account details have been updated successfully");
  };

  // Handler for task status change
  const handleTaskStatusChange = async (taskId) => {
    try {
      // Find the task being updated
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Create a local loading state for this specific task
      setTasks(
        tasks.map((t) => (t.id === taskId ? { ...t, isLoading: true } : t))
      );

      // Determine the new status
      const newStatus = task.status === "completed" ? "pending" : "completed";

      // Update the task status in the backend
      await accountService.updateTaskStatus(taskId, newStatus);

      // Update the task status in the UI
      setTasks(
        tasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus, isLoading: false } : t
        )
      );

      // Also update the selected task if it's the one being changed
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({
          ...selectedTask,
          status: newStatus,
        });
      }

      // Show success message
      showSuccessToast(
        newStatus === "completed"
          ? "Task marked as completed"
          : "Task marked as pending"
      );
    } catch (err) {
      console.error("Error updating task status:", err);
      // Revert the changes and remove loading state if the API call fails
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, isLoading: false } : t))
      );

      // Show error message
      showErrorToast("Failed to update task status. Please try again.");
    }
  };

  // Handler for task selection
  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setCurrentView("taskDetail");
  };

  // Format date for upcoming events
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return dateStr;
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="bg-slate-100 min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading your account..." />
      </div>
    );
  }

  // Render the appropriate view based on state
  if (currentView === "editAccount") {
    return (
      <div className="bg-slate-100 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <EditAccountDetails
            user={user}
            onSave={handleSaveAccountDetails}
            onCancel={() => setCurrentView("main")}
          />
        </div>
      </div>
    );
  }

  if (currentView === "allTasks") {
    return (
      <div className="bg-slate-100 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <AllTasksView
            onBack={() => setCurrentView("main")}
            onTaskSelect={handleTaskSelect}
            onStatusChange={handleTaskStatusChange}
            tasks={tasks}
          />
        </div>
      </div>
    );
  }

  if (currentView === "taskDetail" && selectedTask) {
    return (
      <div className="bg-slate-100 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <TaskDetailView
            task={selectedTask}
            onBack={() => setCurrentView("allTasks")}
            onStatusChange={handleTaskStatusChange}
          />
        </div>
      </div>
    );
  }

  // Default view (main)
  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button and profile */}
        <header className="flex justify-between items-center mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h1 className="text-xl font-medium text-slate-700">
              Account Details
            </h1>
          </div>
          <div className="flex items-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.name || "User"}'s profile`}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <span className="ml-2 text-slate-600">{user.email}</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
            <p>{error}</p>
            <button
              onClick={() => {
                fetchUserData();
                fetchTasks();
                fetchEvents();
              }}
              className="text-red-700 underline mt-2 hover:text-red-900 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - User profile */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-4xl mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : user.name ? (
                    user.name.charAt(0).toUpperCase()
                  ) : (
                    "U"
                  )}
                </div>
                <h2 className="text-xl font-medium text-slate-800">
                  {user.name || "User"}
                </h2>
                <p className="text-slate-500">{user.email}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-slate-700 mb-3">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <div
                    onClick={() => {
                      setCurrentView("editAccount");
                    }}
                    className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                      <Edit2 size={16} />
                    </div>
                    <span className="ml-3 text-slate-600">Edit Profile</span>
                  </div>
                  <div
                    onClick={() => setCurrentView("allTasks")}
                    className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white">
                      <CheckSquare size={16} />
                    </div>
                    <span className="ml-3 text-slate-600">My Tasks</span>
                  </div>
                  <Link
                    to="/calander_page"
                    className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <Calendar size={16} />
                    </div>
                    <span className="ml-3 text-slate-600">Calendar</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Account details and tasks */}
          <div className="md:col-span-2">
            {/* Account details card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-slate-800">
                  Account Details
                </h2>
                <button
                  onClick={() => setCurrentView("editAccount")}
                  className="text-indigo-600 flex items-center hover:text-indigo-800 transition-colors"
                >
                  <Edit2 size={16} />
                  <span className="ml-1">Edit</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex border-b pb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="text-slate-800">
                      {user.name || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex border-b pb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="text-slate-800">{user.email}</p>
                  </div>
                </div>
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                    <Key size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500">Password</p>
                    <p className="text-slate-800">••••••••</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("editAccount");
                    }}
                    className="text-indigo-600 flex items-center hover:text-indigo-800 transition-colors"
                  >
                    <span className="mr-1">Change</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Events card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-slate-800">
                  Upcoming Events
                </h2>
                <Link
                  to="/calander_page"
                  className="text-indigo-600 flex items-center hover:text-indigo-800 transition-colors"
                >
                  <span className="mr-1">View All</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="space-y-3">
                {loadingEvents ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="small" text="Loading events..." />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar
                      size={40}
                      className="mx-auto text-slate-300 mb-2"
                    />
                    <p className="text-slate-500">No upcoming events</p>
                    <Link
                      to="/calander_page"
                      className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Go to Calendar
                    </Link>
                  </div>
                ) : (
                  events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors duration-150"
                    >
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                          <Calendar size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-800">
                            {event.title}
                          </h3>
                          <div className="text-sm text-slate-500 flex items-center mt-1">
                            <span className="mr-3">
                              {formatDate(event.date)}
                            </span>
                            <span>{event.time}</span>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            event.type === "meeting"
                              ? "bg-blue-100 text-blue-800"
                              : event.type === "presentation"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {event.type.charAt(0).toUpperCase() +
                            event.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tasks card */}
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-slate-800">
                  Your Tasks
                </h2>
                <button
                  onClick={() => setCurrentView("allTasks")}
                  className="text-indigo-600 flex items-center hover:text-indigo-800 transition-colors"
                >
                  <span className="mr-1">View All</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {loadingTasks ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="small" text="Loading tasks..." />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckSquare
                      size={40}
                      className="mx-auto text-slate-300 mb-2"
                    />
                    <p className="text-slate-500">No tasks found</p>
                    <button
                      onClick={() => setCurrentView("allTasks")}
                      className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Add a task
                    </button>
                  </div>
                ) : (
                  tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                      onClick={() => handleTaskSelect(task)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskStatusChange(task.id);
                              }}
                              className="p-1 rounded-full hover:bg-slate-200 focus:outline-none transition-colors duration-150"
                              disabled={task.isLoading}
                            >
                              {task.isLoading ? (
                                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-indigo-600 rounded-full"></div>
                              ) : (
                                <CheckSquare
                                  size={16}
                                  className={
                                    task.status === "completed"
                                      ? "text-green-500"
                                      : "text-slate-400"
                                  }
                                />
                              )}
                            </button>
                          </div>
                          <div className="ml-3">
                            <p
                              className={`text-slate-800 font-medium ${
                                task.status === "completed"
                                  ? "line-through text-slate-500"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="text-sm text-slate-500">
                              Due: {task.deadline}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            task.priority === "High"
                              ? "bg-red-100 text-red-800"
                              : task.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                {tasks.length > 3 && (
                  <div
                    className="mt-3 text-center"
                    onClick={() => setCurrentView("allTasks")}
                  >
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm transition-colors">
                      View all {tasks.length} tasks
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
