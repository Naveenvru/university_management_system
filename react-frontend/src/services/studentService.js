import api from './api';

const studentService = {
  // Get all students
  getAll: async (params = {}) => {
    const response = await api.get('/students/', { params });
    return response.data;
  },

  // Get student by ID
  getById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Create student
  create: async (studentData) => {
    const response = await api.post('/students/', studentData);
    return response.data;
  },

  // Update student
  update: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  // Delete student
  delete: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};

export default studentService;
