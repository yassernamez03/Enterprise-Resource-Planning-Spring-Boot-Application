import AxiosClient from './AxiosClient';

const EMPLOYEE_API_BASE_URL = '/api/employees'; // Adjust the base URL according to your API

const employeeServices = {
getAllEmployees: async () => {
    try {
    const response = await AxiosClient.get(EMPLOYEE_API_BASE_URL);
    // Ensure we always return an array
    return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
    console.error('Error fetching employees:', error);
    // Return empty array instead of throwing to prevent crashes
    return [];
    }
},

getEmployeeById: async (id) => {
    try {
    const response = await AxiosClient.get(`${EMPLOYEE_API_BASE_URL}/${id}`);
    return response.data;
    } catch (error) {
    console.error(`Error fetching employee with ID ${id}:`, error);
    throw error;
    }
},

createEmployee: async (employee) => {
    try {
    const response = await AxiosClient.post(EMPLOYEE_API_BASE_URL, employee);
    return response.data;
    } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
    }
},

updateEmployee: async (id, employee) => {
    try {
    const response = await AxiosClient.put(`${EMPLOYEE_API_BASE_URL}/${id}`, employee);
    return response.data;
    } catch (error) {
    console.error(`Error updating employee with ID ${id}:`, error);
    throw error;
    }
},

deleteEmployee: async (id) => {
    try {
    const response = await AxiosClient.delete(`${EMPLOYEE_API_BASE_URL}/${id}`);
    return response.data;
    } catch (error) {
    console.error(`Error deleting employee with ID ${id}:`, error);
    throw error;
    }
}
};

export default employeeServices;