import api from './api';

const enrollmentService = {
  // Get all enrollments
  getAll: async (params = {}) => {
    const response = await api.get('/enrollments/', { params });
    return response.data;
  },

  // Get enrollment by composite key (student_id, course_id)
  getById: async (student_id, course_id) => {
    const response = await api.get(`/enrollments/${student_id}/${course_id}`);
    return response.data;
  },

  // Create enrollment
  create: async (enrollmentData) => {
    const response = await api.post('/enrollments/', enrollmentData);
    return response.data;
  },

  // Update enrollment
  update: async (student_id, course_id, enrollmentData) => {
    const response = await api.put(`/enrollments/${student_id}/${course_id}`, enrollmentData);
    return response.data;
  },

  // Delete enrollment
  delete: async (student_id, course_id) => {
    const response = await api.delete(`/enrollments/${student_id}/${course_id}`);
    return response.data;
  },
};

export default enrollmentService;
