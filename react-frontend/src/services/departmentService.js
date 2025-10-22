import api from './api';

const departmentService = {
  // Get all departments
  getAll: async (params = {}) => {
    const response = await api.get('/departments/', { params });
    return response.data;
  },

  // Get department by ID
  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Create department
  create: async (deptData) => {
    const response = await api.post('/departments/', deptData);
    return response.data;
  },

  // Update department
  update: async (id, deptData) => {
    const response = await api.put(`/departments/${id}`, deptData);
    return response.data;
  },

  // Delete department
  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};

export default departmentService;
