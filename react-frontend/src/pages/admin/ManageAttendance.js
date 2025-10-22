import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendanceService';
import Loading from '../../components/Loading';

const ManageAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    attendance_date: '',
    status: 'present',
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAll();
      setAttendance(data.attendance || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await attendanceService.update(editingRecord.attendance_id, formData);
      } else {
        await attendanceService.create(formData);
      }
      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      student_id: record.student_id,
      course_id: record.course_id,
      attendance_date: record.attendance_date ? record.attendance_date.split('T')[0] : '',
      status: record.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await attendanceService.delete(id);
        fetchAttendance();
      } catch (err) {
        setError('Failed to delete record');
      }
    }
  };

  const resetForm = () => {
    setFormData({ student_id: '', course_id: '', attendance_date: '', status: 'present' });
    setEditingRecord(null);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1>Manage Attendance</h1>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} style={styles.addButton}>
          {showForm ? 'Cancel' : 'Add Attendance'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingRecord ? 'Edit Attendance' : 'Add Attendance'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Student ID:</label>
                <input type="number" name="student_id" value={formData.student_id} onChange={handleInputChange} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label>Course ID:</label>
                <input type="number" name="course_id" value={formData.course_id} onChange={handleInputChange} style={styles.input} required />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Date:</label>
                <input type="date" name="attendance_date" value={formData.attendance_date} onChange={handleInputChange} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label>Status:</label>
                <select name="status" value={formData.status} onChange={handleInputChange} style={styles.input} required>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>
              {editingRecord ? 'Update' : 'Create'} Attendance
            </button>
          </form>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Student ID</th>
            <th style={styles.th}>Course ID</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((record) => (
            <tr key={record.attendance_id}>
              <td style={styles.td}>{record.attendance_id}</td>
              <td style={styles.td}>{record.student_id}</td>
              <td style={styles.td}>{record.course_id}</td>
              <td style={styles.td}>{new Date(record.attendance_date).toLocaleDateString()}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.badge,
                  backgroundColor: record.status === 'present' ? '#27ae60' : record.status === 'absent' ? '#e74c3c' : '#f39c12'
                }}>
                  {record.status}
                </span>
              </td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(record)} style={styles.editButton}>Edit</button>
                <button onClick={() => handleDelete(record.attendance_id)} style={styles.deleteButton}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {attendance.length === 0 && <p style={styles.noData}>No attendance records found</p>}
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  addButton: { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { backgroundColor: '#e74c3c', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  formContainer: { backgroundColor: '#ecf0f1', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px', marginTop: '5px' },
  submitButton: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
  th: { backgroundColor: '#34495e', color: 'white', padding: '12px', textAlign: 'left', fontWeight: 'bold' },
  td: { padding: '12px', borderBottom: '1px solid #ecf0f1' },
  badge: { padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px' },
  editButton: { padding: '6px 12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' },
  deleteButton: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  noData: { textAlign: 'center', padding: '20px', color: '#7f8c8d' },
};

export default ManageAttendance;
