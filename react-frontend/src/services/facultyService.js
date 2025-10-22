import api from './api';

const facultyService = {
  // Get all faculty
  getAll: async (params = {}) => {
    const response = await api.get('/faculty/', { params });
    return response.data;
  },

  // Get faculty by ID
  getById: async (id) => {
    const response = await api.get(`/faculty/${id}`);
    return response.data;
  },

  // Create faculty
  create: async (facultyData) => {
    const response = await api.post('/faculty/', facultyData);
    return response.data;
  },

  // Update faculty
  update: async (id, facultyData) => {
    const response = await api.put(`/faculty/${id}`, facultyData);
    return response.data;
  },

  // Delete faculty
  delete: async (id) => {
    const response = await api.delete(`/faculty/${id}`);
    return response.data;
  },

  // Get courses assigned to a faculty member
  getCourses: async (facultyId) => {
    const response = await api.get(`/faculty/${facultyId}/courses`);
    return response.data;
  },
};

export default facultyService;
