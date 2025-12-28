import api from './api';

const gradeService = {
  // Get all grades
  getAll: async (params = {}) => {
    const response = await api.get('/grades/', { params });
    return response.data;
  },

  // Get grade by composite key (student_id, course_id)
  getById: async (student_id, course_id) => {
    const response = await api.get(`/grades/${student_id}/${course_id}`);
    return response.data;
  },

  // Get grade distribution statistics
  getDistribution: async () => {
    const response = await api.get('/grades/statistics/distribution');
    return response.data;
  },

  // Create grade
  create: async (gradeData) => {
    const response = await api.post('/grades/', gradeData);
    return response.data;
  },

  // Update grade
  update: async (student_id, course_id, gradeData) => {
    const response = await api.put(`/grades/${student_id}/${course_id}`, gradeData);
    return response.data;
  },

  // Delete grade
  delete: async (student_id, course_id) => {
    const response = await api.delete(`/grades/${student_id}/${course_id}`);
    return response.data;
  },
};

export default gradeService;
