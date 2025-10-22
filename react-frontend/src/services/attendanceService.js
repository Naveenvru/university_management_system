import api from './api';

const attendanceService = {
  // Get all attendance records
  getAll: async (params = {}) => {
    const response = await api.get('/attendance/', { params });
    return response.data;
  },

  // Get attendance by ID
  getById: async (id) => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },

  // Create attendance record
  create: async (attendanceData) => {
    const response = await api.post('/attendance/', attendanceData);
    return response.data;
  },

  // Update attendance record
  update: async (id, attendanceData) => {
    const response = await api.put(`/attendance/${id}`, attendanceData);
    return response.data;
  },

  // Delete attendance record
  delete: async (id) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },
};

export default attendanceService;
