import React, { useState, useEffect } from 'react';
import departmentService from '../../services/departmentService';
import facultyService from '../../services/facultyService';
import Loading from '../../components/Loading';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    department_code: '',
    department_name: '',
    head_of_department: '',
    contact_email: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptData, facultyData] = await Promise.all([
        departmentService.getAll(),
        facultyService.getAll()
      ]);
      setDepartments(deptData.departments || []);
      setFaculties(facultyData.faculty || []);
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
      const submitData = {
        ...formData,
        head_of_department: formData.head_of_department ? parseInt(formData.head_of_department) : null
      };
      
      if (editingDepartment) {
        await departmentService.update(editingDepartment.department_id, submitData);
      } else {
        await departmentService.create(submitData);
      }
      setShowForm(false);
      setEditingDepartment(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      department_code: department.department_code,
      department_name: department.department_name,
      head_of_department: department.head_of_department || '',
      contact_email: department.contact_email || '',
      is_active: department.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete department');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      department_code: '',
      department_name: '',
      head_of_department: '',
      contact_email: '',
      is_active: true,
    });
    setEditingDepartment(null);
  };

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.faculty_id === facultyId);
    return faculty ? `${faculty.first_name || ''} ${faculty.last_name || ''}` : 'Not Assigned';
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1>Manage Departments</h1>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} style={styles.addButton}>
          {showForm ? 'Cancel' : 'Add Department'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingDepartment ? 'Edit Department' : 'Add Department'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Department Code:</label>
                <input
                  type="text"
                  name="department_code"
                  value={formData.department_code}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., CSE"
                  maxLength="10"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Department Name:</label>
                <input
                  type="text"
                  name="department_name"
                  value={formData.department_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Head of Department:</label>
                <select
                  name="head_of_department"
                  value={formData.head_of_department}
                  onChange={handleInputChange}
                  style={styles.input}
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(faculty => (
                    <option key={faculty.faculty_id} value={faculty.faculty_id}>
                      {faculty.first_name} {faculty.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Contact Email:</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="department@university.edu"
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
                Active
              </label>
            </div>
            <button type="submit" style={styles.submitButton}>
              {editingDepartment ? 'Update' : 'Create'} Department
            </button>
          </form>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Head of Department</th>
              <th style={styles.th}>Contact Email</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.department_id} style={styles.tr}>
                <td style={styles.td}>{dept.department_id}</td>
                <td style={styles.td}><strong>{dept.department_code}</strong></td>
                <td style={styles.td}>{dept.department_name}</td>
                <td style={styles.td}>{getFacultyName(dept.head_of_department)}</td>
                <td style={styles.td}>{dept.contact_email}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: dept.is_active ? '#27ae60' : '#e74c3c'
                  }}>
                    {dept.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(dept)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(dept.department_id)} style={styles.deleteButton}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '10px',
  },
  formContainer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
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
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
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
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid #ddd',
  },
  td: {
    padding: '12px',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default ManageDepartments;
