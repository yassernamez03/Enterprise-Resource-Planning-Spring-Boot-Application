import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, FileSearch } from "lucide-react";
import userService from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../Components/Common/ConfirmDialog";
import LoadingSpinner from "../Components/Common/LoadingSpinner";
import EmptyState from "../Components/Common/EmptyState";
import logService from "../services/logService";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useToast();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  // In your state definitions
  const [allLogs, setAllLogs] = useState([]); // Store all logs from server
  const [filteredLogs, setFilteredLogs] = useState([]); // Store filtered logs
  const [logFilters, setLogFilters] = useState({
    userName: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger",
  });

  // State for password reset dialog
  const [passwordResetState, setPasswordResetState] = useState({
    isOpen: false,
    userId: null,
    userName: "",
    newPassword: "",
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  });

  // Load data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (activeTab === "pending") {
          const data = await userService.getPendingApprovals();
          setPendingUsers(data);
        } else if (activeTab === "all") {
          const data = await userService.getAllUsers();

          setAllUsers(data);
        } else if (activeTab === "logs") {
          try {
            setLoading(true);
            const data = await logService.getAllLogs();
            setAllLogs(data || []); // Fallback to empty array
            setFilteredLogs(data || []); // Fallback to empty array
            console.log(data);
          } catch (error) {
            console.error("Error fetching logs:", error);
            setAllLogs([]);
            setFilteredLogs([]);
            setError("Failed to load logs");
          } finally {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load user data. Please try again.");
        showErrorToast("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, showErrorToast]);

  useEffect(() => {
    if (activeTab === "logs") {
      filterLogs();
    }
  }, [logFilters, allLogs]);

  // Handle user approval with confirmation
  const handleApproveUser = (userId, userName) => {
    console.log("Opening confirm dialog...");
    setConfirmDialog({
      isOpen: true,
      title: "Approve User",
      message: `Are you sure you want to approve ${userName}? They will gain immediate access to the system.`,
      type: "info",
      onConfirm: async () => {
        try {
          // Show a loading state
          setPendingUsers(
            pendingUsers.map((user) =>
              user.id === userId ? { ...user, isLoading: true } : user
            )
          );

          // Close the dialog
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

          await userService.approveUser(userId);

          // Update the pending users list
          setPendingUsers(pendingUsers.filter((user) => user.id !== userId));

          // Show success toast
          showSuccessToast("User has been approved successfully");
        } catch (err) {
          console.error("Error approving user:", err);
          // Remove loading state
          setPendingUsers(
            pendingUsers.map((user) =>
              user.id === userId ? { ...user, isLoading: false } : user
            )
          );

          showErrorToast("Failed to approve user. Please try again.");
        }
      },
    });
  };

  // Handle user rejection with confirmation
  const handleRejectUser = (userId, userName) => {
    console.log("Opening confirm dialog...");
    setConfirmDialog({
      isOpen: true,
      title: "Reject User",
      message: `Are you sure you want to reject ${userName}? This will delete their account and they'll need to register again.`,
      type: "danger",
      onConfirm: async () => {
        try {
          // Show a loading state
          setPendingUsers(
            pendingUsers.map((user) =>
              user.id === userId ? { ...user, isLoading: true } : user
            )
          );

          // Close the dialog
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

          await userService.rejectUser(userId);

          // Update the pending users list
          setPendingUsers(pendingUsers.filter((user) => user.id !== userId));

          // Show success toast
          showSuccessToast("User has been rejected");
        } catch (err) {
          console.error("Error rejecting user:", err);
          // Remove loading state
          setPendingUsers(
            pendingUsers.map((user) =>
              user.id === userId ? { ...user, isLoading: false } : user
            )
          );

          showErrorToast("Failed to reject user. Please try again.");
        }
      },
    });
  };

  // Add this function in your component
  const filterLogs = () => {
    let result = [...allLogs];

    if (logFilters.userName) {
      result = result.filter((log) =>
        String(log.userName || "")
          .toLowerCase()
          .includes(logFilters.userName.toLowerCase())
      );
    }

    if (logFilters.action) {
      result = result.filter((log) =>
        log.action.toLowerCase().includes(logFilters.action.toLowerCase())
      );
    }

    if (logFilters.dateFrom) {
      const fromDate = new Date(logFilters.dateFrom);
      result = result.filter((log) => new Date(log.timestamp) >= fromDate);
    }

    if (logFilters.dateFrom) {
      const toDate = new Date(logFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter((log) => new Date(log.timestamp) <= toDate);
    }

    setPagination((prev) => ({
      ...prev,
      totalItems: result.length,
      currentPage: 1, // Reset to first page when filters change
    }));

    setFilteredLogs(result);
  };

  // Handle password reset flow
  const handleResetPasswordClick = (userId, userName) => {
    setPasswordResetState({
      isOpen: true,
      userId,
      userName,
      newPassword: "",
    });
  };

  const handlePasswordInputChange = (e) => {
    setPasswordResetState({
      ...passwordResetState,
      newPassword: e.target.value,
    });
  };

  const handlePasswordResetSubmit = () => {
    // Close the password input dialog
    setPasswordResetState({
      ...passwordResetState,
      isOpen: false,
    });

    // Show confirmation dialog
    console.log("Opening confirm dialog...");
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Password Reset",
      message: `Are you sure you want to reset the password for ${passwordResetState.userName}?`,
      type: "warning",
      onConfirm: async () => {
        try {
          // Call API to reset password
          await userService.resetUserPassword(
            passwordResetState.userId,
            passwordResetState.newPassword
          );

          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showSuccessToast("Password has been reset successfully");

          // Refresh data
          if (activeTab === "all") {
            setActiveTab("");
            setTimeout(() => setActiveTab("all"), 10);
          }
        } catch (err) {
          console.error("Error resetting password:", err);
          showErrorToast("Failed to reset password. Please try again.");
        }
      },
    });
  };

  const exportToJson = () => {
    setIsExporting(true);
    try {
      const dataStr = JSON.stringify(filteredLogs, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `logs_${new Date().toISOString()}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCsv = () => {
    setIsExporting(true);
    try {
      // Convert logs to CSV format
      const headers = [
        "Timestamp",
        "User",
        "Action",
        "Type",
        "IP Address",
        "Details",
      ];
      const rows = filteredLogs.map((log) => [
        new Date(log.timestamp).toISOString(),
        log.userName || "System",
        log.action,
        log.logType,
        log.ipAddress,
        log.details.replace(/"/g, '""'), // Escape quotes in details
      ]);

      // Create CSV content
      let csvContent = headers.join(",") + "\n";
      rows.forEach((row) => {
        csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
      });

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `logs_${new Date().toISOString()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  // Function to get status badge color
  const getStatusBadgeColor = (approvalStatus) => {
    // Make sure approvalStatus is a string (if it's a number, convert it)
    const statusVal = String(approvalStatus).toUpperCase();

    // Match both numeric and string values
    switch (statusVal) {
      case "APPROVED":
      case "1":
        return "bg-green-100 text-green-800"; // Green for approved

      case "PENDING":
      case "0":
        return "bg-gray-100 text-gray-800"; // Gray for pending

      case "REJECTED":
      case "-1":
        return "bg-red-100 text-red-800"; // Red for rejected

      case "INACTIVE":
      case "SUSPENDED":
      case "2":
        return "bg-yellow-100 text-yellow-800"; // Yellow for other statuses

      default:
        return "bg-gray-100 text-gray-800"; // Default to gray
    }
  };

  // Function to get readable status text
  const getStatusText = (approvalStatus) => {
    const statusVal = String(approvalStatus).toUpperCase();

    switch (statusVal) {
      case "APPROVED":
      case "1":
        return "Approved";

      case "PENDING":
      case "0":
        return "Pending";

      case "REJECTED":
      case "-1":
        return "Rejected";

      case "INACTIVE":
      case "SUSPENDED":
      case "2":
        return "Inactive";

      default:
        // If it's a number or unknown value, return a more readable form
        return isNaN(approvalStatus)
          ? approvalStatus
          : `Status: ${approvalStatus}`;
    }
  };

  const Pagination = () => {
    const totalPages = Math.ceil(
      pagination.totalItems / pagination.itemsPerPage
    );
    const startItem =
      (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
    const endItem = Math.min(
      pagination.currentPage * pagination.itemsPerPage,
      pagination.totalItems
    );

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{pagination.totalItems}</span> results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                currentPage: Math.max(1, prev.currentPage - 1),
              }))
            }
            disabled={pagination.currentPage === 1}
            className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                currentPage: Math.min(totalPages, prev.currentPage + 1),
              }))
            }
            disabled={pagination.currentPage === totalPages}
            className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // If the user is not an admin, show an access denied message
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center text-4xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 text-center mb-6">
            You don't have permission to access this page.
          </p>
          <Link
            to="/"
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simplified header with back button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate("/")}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Admin Dashboard
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">Manage users and system settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("pending")}
                className={`${
                  activeTab === "pending"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                Pending Approvals
                {pendingUsers.length > 0 && (
                  <span className="ml-2 py-0.5 px-2 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`${
                  activeTab === "all"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                All Users
              </button>

              <button
                onClick={() => setActiveTab("logs")}
                className={`${
                  activeTab === "logs"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              >
                System Logs
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" text="Loading users..." />
          </div>
        )}

        {/* Pending Approvals Table */}
        {!loading && activeTab === "pending" && (
          <>
            {pendingUsers.length === 0 ? (
              <EmptyState
                icon={
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                title="No pending approvals"
                message="All user registrations have been processed."
              />
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Registered On
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {user.fullName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              handleApproveUser(user.id, user.fullName)
                            }
                            className="text-green-600 hover:text-green-900 mr-4 disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={user.isLoading}
                          >
                            {user.isLoading ? (
                              <span className="flex items-center">
                                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-green-600 rounded-full mr-1"></div>
                                Processing...
                              </span>
                            ) : (
                              "Approve"
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleRejectUser(user.id, user.fullName)
                            }
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                            disabled={user.isLoading}
                          >
                            {user.isLoading ? (
                              <span className="flex items-center">
                                <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-red-600 rounded-full mr-1"></div>
                                Processing...
                              </span>
                            ) : (
                              "Reject"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* All Users Table - With Responsive Design */}
        {!loading && activeTab === "all" && (
          <>
            {allUsers.length === 0 ? (
              <EmptyState
                icon={
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                }
                title="No users found"
                message="There are no users in the system yet."
              />
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell"
                        >
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Role
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-800 font-medium">
                                  {user.fullName.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.fullName}
                                </div>
                                <div className="text-sm text-gray-500 sm:hidden">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-900">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                                user.approvalStatus
                              )}`}
                            >
                              {getStatusText(user.approvalStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-end sm:items-center justify-end">
                              <button
                                onClick={() => {
                                  // Change role logic
                                  const newRole =
                                    user.role === "ADMIN" ? "USER" : "ADMIN";
                                  console.log("Opening confirm dialog...");
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: "Change User Role",
                                    message: `Are you sure you want to change ${user.fullName}'s role to ${newRole}?`,
                                    type: "warning",
                                    onConfirm: async () => {
                                      try {
                                        await userService.changeUserRole(
                                          user.id,
                                          newRole
                                        );
                                        setConfirmDialog((prev) => ({
                                          ...prev,
                                          isOpen: false,
                                        }));
                                        showSuccessToast(
                                          `User role changed to ${newRole}`
                                        );
                                        // Refresh data
                                        setActiveTab("");
                                        setTimeout(
                                          () => setActiveTab("all"),
                                          10
                                        );
                                      } catch (err) {
                                        showErrorToast(
                                          "Failed to change user role"
                                        );
                                      }
                                    },
                                  });
                                }}
                                className="px-2 py-1 w-full sm:w-auto text-center bg-indigo-100 text-indigo-800 rounded text-xs font-medium hover:bg-indigo-200 transition-colors"
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() =>
                                  handleResetPasswordClick(
                                    user.id,
                                    user.fullName
                                  )
                                }
                                className="px-2 py-1 w-full sm:w-auto text-center bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                              >
                                Reset Password
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === "logs" && (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            {/* Filter controls */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow mr-4">
                <input
                  placeholder="User Name"
                  value={logFilters.userName}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, userName: e.target.value })
                  }
                  className="border rounded p-2"
                />
                <input
                  placeholder="Action"
                  value={logFilters.action}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, action: e.target.value })
                  }
                  className="border rounded p-2"
                />
                <input
                  type="date"
                  placeholder="From"
                  value={logFilters.dateFrom}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, dateFrom: e.target.value })
                  }
                  className="border rounded p-2"
                />
                <input
                  type="date"
                  placeholder="To"
                  value={logFilters.dateTo}
                  onChange={(e) =>
                    setLogFilters({ ...logFilters, dateTo: e.target.value })
                  }
                  className="border rounded p-2"
                />
              </div>
              <button
                onClick={() =>
                  setLogFilters({
                    userName: "",
                    action: "",
                    dateFrom: "",
                    dateTo: "",
                  })
                }
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="p-8 text-center">
                <LoadingSpinner text="Loading logs..." />
                <div className="mt-4 animate-pulse h-10 bg-gray-200 rounded"></div>
              </div>
            )}

            {/* Empty state */}
            {!loading && filteredLogs.length === 0 && (
              <div className="p-8 text-center">
                <EmptyState
                  icon={
                    <FileSearch className="h-12 w-12 mx-auto text-gray-400" />
                  }
                  title={
                    filteredLogs.length === 0 && allLogs.length > 0
                      ? "No matching logs found"
                      : "No logs available"
                  }
                  message={
                    filteredLogs.length === 0 && allLogs.length > 0
                      ? "Try adjusting your filters"
                      : "System logs will appear here"
                  }
                />
              </div>
            )}

            {/* Logs table */}
            {!loading && filteredLogs.length > 0 && (
              <>
                {/* Floating export buttons container - enhanced */}
                <div className="fixed right-4 top-24 z-10 flex flex-col gap-2">
                  <button
                    onClick={exportToJson}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2 shadow-lg transition-all"
                    title="Export to JSON"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  <button
                    onClick={exportToCsv}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 sm:gap-2 shadow-lg transition-all"
                    title="Export to CSV"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <div className="px-6 py-3 flex justify-between items-center border-t border-gray-200">
                    <div className="text-sm text-gray-700">Items per page:</div>
                    <select
                      value={pagination.itemsPerPage}
                      onChange={(e) =>
                        setPagination((prev) => ({
                          ...prev,
                          itemsPerPage: Number(e.target.value),
                          currentPage: 1,
                        }))
                      }
                      className="border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          IP Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLogs
                        .slice(
                          (pagination.currentPage - 1) *
                            pagination.itemsPerPage,
                          pagination.currentPage * pagination.itemsPerPage
                        )
                        .map((log) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.userName || "System"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.action}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  log.logType === "AUTH"
                                    ? "bg-blue-100 text-blue-800"
                                    : log.logType === "USER"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {log.logType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.ipAddress}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {log.details}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <Pagination />
              </>
            )}
          </div>
        )}
      </main>

      {/* Password Reset Dialog - Made Responsive */}
      {passwordResetState.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-900 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password for {passwordResetState.userName}
            </h3>
            <div className="mb-6">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordResetState.newPassword}
                onChange={handlePasswordInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new password"
                autoFocus
              />
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-end">
              <button
                onClick={() =>
                  setPasswordResetState({
                    ...passwordResetState,
                    isOpen: false,
                  })
                }
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordResetSubmit}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-300 disabled:cursor-not-allowed"
                disabled={!passwordResetState.newPassword}
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default AdminDashboard;
