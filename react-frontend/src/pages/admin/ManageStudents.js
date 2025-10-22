import React, { useState, useEffect } from 'react';
import studentService from '../../services/studentService';
import Loading from '../../components/Loading';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    enrollment_date: '',
    year_level: '',
    gpa: '',
    is_active: true,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAll();
      setStudents(data.students || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
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
      if (editingStudent) {
        await studentService.update(editingStudent.student_id, formData);
      } else {
        await studentService.create(formData);
      }
      setShowForm(false);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      user_id: student.user_id,
      enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : '',
      year_level: student.year_level,
      gpa: student.gpa,
      is_active: student.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentService.delete(id);
        fetchStudents();
      } catch (err) {
        setError('Failed to delete student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      enrollment_date: '',
      year_level: '',
      gpa: '',
      is_active: true,
    });
    setEditingStudent(null);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Students</h1>
        <button 
          onClick={() => { setShowForm(!showForm); resetForm(); }}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : 'Add Student'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>User ID:</label>
                <input
                  type="number"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>Enrollment Date:</label>
                <input
                  type="date"
                  name="enrollment_date"
                  value={formData.enrollment_date}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Year Level:</label>
                <input
                  type="number"
                  name="year_level"
                  value={formData.year_level}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>GPA:</label>
                <input
                  type="number"
                  step="0.01"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleInputChange}
                  style={styles.input}
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
                />
                {' '}Active
              </label>
            </div>
            <button type="submit" style={styles.submitButton}>
              {editingStudent ? 'Update' : 'Create'} Student
            </button>
          </form>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>User ID</th>
              <th style={styles.th}>Enrollment Date</th>
              <th style={styles.th}>Year Level</th>
              <th style={styles.th}>GPA</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.student_id}>
                <td style={styles.td}>{student.student_id}</td>
                <td style={styles.td}>{student.user_id}</td>
                <td style={styles.td}>
                  {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
                </td>
                <td style={styles.td}>{student.year_level}</td>
                <td style={styles.td}>{student.gpa}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: student.is_active ? '#27ae60' : '#e74c3c'
                  }}>
                    {student.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button 
                    onClick={() => handleEdit(student)}
                    style={styles.editButton}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(student.student_id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <p style={styles.noData}>No students found</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    color: '#2c3e50',
    margin: 0,
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  formContainer: {
    backgroundColor: '#ecf0f1',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  form: {
    marginTop: '15px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '8px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    marginTop: '5px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
  },
  th: {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #ecf0f1',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
    fontSize: '12px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  noData: {
    textAlign: 'center',
    padding: '20px',
    color: '#7f8c8d',
  },
};

export default ManageStudents;
