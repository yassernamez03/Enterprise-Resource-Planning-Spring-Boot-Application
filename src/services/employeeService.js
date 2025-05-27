import { apiService } from './apiInterceptor';

const TASKS_ENDPOINT = '/task-events';
const employeeService = {
  /**
   * Get all employees
   * @returns {Promise<Array>} Promise resolving to an array of employee objects
   */
  getAllEmployees: async () => {
    try {
      return await apiService.get('/hr/employees');
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  /**
   * Get employee by ID
   * @param {string|number} id - Employee ID
   * @returns {Promise<Object>} Promise resolving to employee object
   */
  getEmployeeById: async (id) => {
    try {
      return await apiService.get(`/hr/employees/${id}`);
    } catch (error) {
      console.error(`Error fetching employee with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get all employees
   * @returns {Promise<Array>} Promise resolving to an array of employee objects
   */
  getEmployeeTasks: async (userId) => {
      try {
          return await apiService.get(`${TASKS_ENDPOINT}/admin/users/${userId}/tasks`);
      } catch (error) {
          console.error(`Error fetching tasks for employee ${userId}:`, error);
          throw error;
      }
  },
  /**
   * Create a new employee
   * @param {Object} employeeData - Employee data to create
   * @returns {Promise<Object>} Promise resolving to the created employee
   */
  createEmployee: async (employeeData) => {
  try {
    console.log('Sending employee data:', employeeData);
    return await apiService.post('/hr/employees/create', employeeData);
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
},

  /**
   * Update an existing employee
   * @param {string|number} id - Employee ID to update
   * @param {Object} employeeData - Updated employee data
   * @returns {Promise<Object>} Promise resolving to the updated employee
   */
  
  updateEmployee: async (id, employeeData) => {
    try {
      console.log('Sending employee data:', employeeData);
      return await apiService.put(`/hr/employees/update/${id}`, employeeData);
    } catch (error) {
      console.error(`Error updating employee with id ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an employee
   * @param {string|number} id - Employee ID to delete
   * @returns {Promise<Object>} Promise resolving to the response data
   */
  deleteEmployee: async (id) => {
    try {
      return await apiService.delete(`/hr/employees/delete/${id}`);
    } catch (error) {
      console.error(`Error deleting employee with id ${id}:`, error);
      throw error;
    }
  }
};

export default employeeService;