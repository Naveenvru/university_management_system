import React, { useState, useEffect } from 'react';
import enrollmentService from '../../services/enrollmentService';
import studentService from '../../services/studentService';
import courseService from '../../services/courseService';
import Loading from '../../components/Loading';

const ManageEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    semester: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, studentsData, coursesData] = await Promise.all([
        enrollmentService.getAll(),
        studentService.getAll(),
        courseService.getAll()
      ]);
      setEnrollments(enrollmentsData.enrollments || []);
      setStudents(studentsData.students || []);
      setCourses(coursesData.courses || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEnrollment) {
        // Use composite key for update
        await enrollmentService.update(editingEnrollment.student_id, editingEnrollment.course_id, formData);
      } else {
        await enrollmentService.create(formData);
      }
      setShowForm(false);
      setEditingEnrollment(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (enrollment) => {
    setEditingEnrollment(enrollment);
    setFormData({
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      enrollment_date: enrollment.enrollment_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      semester: enrollment.semester || '',
      is_active: enrollment.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (student_id, course_id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        await enrollmentService.delete(student_id, course_id);
        fetchData();
      } catch (err) {
        setError('Failed to delete enrollment');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      course_id: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      semester: '',
      is_active: true,
    });
    setEditingEnrollment(null);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.student_id === studentId);
    return student ? `Student ${studentId}` : 'Unknown';
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.course_id === courseId);
    return course ? course.course_name : 'Unknown';
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1>Manage Enrollments</h1>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} style={styles.addButton}>
          {showForm ? 'Cancel' : 'Add Enrollment'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingEnrollment ? 'Edit Enrollment' : 'Add Enrollment'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Student:</label>
                <select
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.student_id} value={student.student_id}>
                      ID: {student.student_id} - User ID: {student.user_id}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Course:</label>
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_name} ({course.course_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Enrollment Date:</label>
                <input
                  type="date"
                  name="enrollment_date"
                  value={formData.enrollment_date}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>Semester:</label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="e.g., Fall 2024, Spring 2025"
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ marginRight: '8px' }}
                />
                Active Enrollment
              </label>
            </div>
            <button type="submit" style={styles.submitButton}>
              {editingEnrollment ? 'Update' : 'Create'} Enrollment
            </button>
          </form>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Student ID</th>
            <th style={styles.th}>Course</th>
            <th style={styles.th}>Enrollment Date</th>
            <th style={styles.th}>Semester</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
              <tr key={`${enrollment.student_id}-${enrollment.course_id}`}>
                <td style={styles.td}>{enrollment.student_id}-{enrollment.course_id}</td>
                <td style={styles.td}>{enrollment.student_id}</td>
                <td style={styles.td}>{getCourseName(enrollment.course_id)}</td>
                <td style={styles.td}>
                  {enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                </td>
                <td style={styles.td}>{enrollment.semester || 'N/A'}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: enrollment.status === 'enrolled' ? '#27ae60' : '#e74c3c'
                  }}>
                    {enrollment.status || 'N/A'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(enrollment)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(enrollment.student_id, enrollment.course_id)} style={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ ...styles.td, textAlign: 'center' }}>No enrollments found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  addButton: { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  formContainer: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px', marginTop: '5px' },
  submitButton: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { backgroundColor: '#e74c3c', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  th: { backgroundColor: '#34495e', color: 'white', padding: '12px', textAlign: 'left' },
  td: { padding: '12px', borderBottom: '1px solid #ecf0f1' },
  badge: { padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px', display: 'inline-block' },
  editButton: { padding: '6px 12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default ManageEnrollments;
