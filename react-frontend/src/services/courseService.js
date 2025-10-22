import api from './api';

const courseService = {
  // Get all courses
  getAll: async (params = {}) => {
    const response = await api.get('/courses/', { params });
    return response.data;
  },

  // Get course by ID
  getById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  // Create course
  create: async (courseData) => {
    const response = await api.post('/courses/', courseData);
    return response.data;
  },

  // Update course
  update: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  // Delete course
  delete: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },
};

export default courseService;
