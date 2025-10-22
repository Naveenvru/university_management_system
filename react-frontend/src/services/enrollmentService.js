import api from './api';

const enrollmentService = {
  // Get all enrollments
  getAll: async (params = {}) => {
    const response = await api.get('/enrollments/', { params });
    return response.data;
  },

  // Get enrollment by ID
  getById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  // Create enrollment
  create: async (enrollmentData) => {
    const response = await api.post('/enrollments/', enrollmentData);
    return response.data;
  },

  // Update enrollment
  update: async (id, enrollmentData) => {
    const response = await api.put(`/enrollments/${id}`, enrollmentData);
    return response.data;
  },

  // Delete enrollment
  delete: async (id) => {
    const response = await api.delete(`/enrollments/${id}`);
    return response.data;
  },
};

export default enrollmentService;
