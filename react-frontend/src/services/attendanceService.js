import api from './api';

const attendanceService = {
  // Get all attendance records
  getAll: async (params = {}) => {
    const response = await api.get('/attendance/', { params });
    return response.data;
  },

  // Get attendance by composite key (student_id, course_id, attendance_date)
  getById: async (student_id, course_id, attendance_date) => {
    const response = await api.get(`/attendance/${student_id}/${course_id}/${attendance_date}`);
    return response.data;
  },

  // Get attendance summary for student and course
  getSummary: async (student_id, course_id) => {
    const response = await api.get(`/attendance/summary/${student_id}/${course_id}`);
    return response.data;
  },

  // Create attendance record
  create: async (attendanceData) => {
    const response = await api.post('/attendance/', attendanceData);
    return response.data;
  },

  // Update attendance record
  update: async (student_id, course_id, attendance_date, attendanceData) => {
    const response = await api.put(`/attendance/${student_id}/${course_id}/${attendance_date}`, attendanceData);
    return response.data;
  },

  // Delete attendance record
  delete: async (student_id, course_id, attendance_date) => {
    const response = await api.delete(`/attendance/${student_id}/${course_id}/${attendance_date}`);
    return response.data;
  },
};

export default attendanceService;
