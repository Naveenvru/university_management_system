import React, { useState, useEffect } from 'react';
import facultyService from '../../services/facultyService';
import Loading from '../../components/Loading';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    department_id: '',
    hire_date: '',
    office_location: '',
    is_active: true,
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const data = await facultyService.getAll();
      setFaculty(data.faculty || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch faculty');
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
      if (editingFaculty) {
        await facultyService.update(editingFaculty.faculty_id, formData);
      } else {
        await facultyService.create(formData);
      }
      setShowForm(false);
      setEditingFaculty(null);
      resetForm();
      fetchFaculty();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      user_id: faculty.user_id,
      department_id: faculty.department_id,
      hire_date: faculty.hire_date ? faculty.hire_date.split('T')[0] : '',
      office_location: faculty.office_location,
      is_active: faculty.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await facultyService.delete(id);
        fetchFaculty();
      } catch (err) {
        setError('Failed to delete faculty');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      department_id: '',
      hire_date: '',
      office_location: '',
      is_active: true,
    });
    setEditingFaculty(null);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Faculty</h1>
        <button 
          onClick={() => { setShowForm(!showForm); resetForm(); }}
          style={styles.addButton}
        >
          {showForm ? 'Cancel' : 'Add Faculty'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}</h3>
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
                <label>Department ID:</label>
                <input
                  type="number"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Hire Date:</label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Office Location:</label>
                <input
                  type="text"
                  name="office_location"
                  value={formData.office_location}
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
              {editingFaculty ? 'Update' : 'Create'} Faculty
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
              <th style={styles.th}>Department ID</th>
              <th style={styles.th}>Hire Date</th>
              <th style={styles.th}>Office</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((fac) => (
              <tr key={fac.faculty_id}>
                <td style={styles.td}>{fac.faculty_id}</td>
                <td style={styles.td}>{fac.user_id}</td>
                <td style={styles.td}>{fac.department_id}</td>
                <td style={styles.td}>
                  {fac.hire_date ? new Date(fac.hire_date).toLocaleDateString() : 'N/A'}
                </td>
                <td style={styles.td}>{fac.office_location || 'N/A'}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: fac.is_active ? '#27ae60' : '#e74c3c'
                  }}>
                    {fac.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(fac)} style={styles.editButton}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(fac.faculty_id)} style={styles.deleteButton}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faculty.length === 0 && <p style={styles.noData}>No faculty found</p>}
      </div>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { color: '#2c3e50', margin: 0 },
  addButton: { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  error: { backgroundColor: '#e74c3c', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  formContainer: { backgroundColor: '#ecf0f1', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  form: { marginTop: '15px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '8px', border: '1px solid #bdc3c7', borderRadius: '4px', marginTop: '5px' },
  submitButton: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' },
  th: { backgroundColor: '#34495e', color: 'white', padding: '12px', textAlign: 'left', fontWeight: 'bold' },
  td: { padding: '12px', borderBottom: '1px solid #ecf0f1' },
  badge: { padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px' },
  editButton: { padding: '6px 12px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' },
  deleteButton: { padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
  noData: { textAlign: 'center', padding: '20px', color: '#7f8c8d' },
};

export default ManageFaculty;
