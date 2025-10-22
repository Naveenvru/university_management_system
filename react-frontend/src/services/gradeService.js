import api from './api';

const gradeService = {
  // Get all grades
  getAll: async (params = {}) => {
    const response = await api.get('/grades/', { params });
    return response.data;
  },

  // Get grade by ID
  getById: async (id) => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },

  // Create grade
  create: async (gradeData) => {
    const response = await api.post('/grades/', gradeData);
    return response.data;
  },

  // Update grade
  update: async (id, gradeData) => {
    const response = await api.put(`/grades/${id}`, gradeData);
    return response.data;
  },

  // Delete grade
  delete: async (id) => {
    const response = await api.delete(`/grades/${id}`);
    return response.data;
  },
};

export default gradeService;
