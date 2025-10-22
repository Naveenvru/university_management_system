import React, { useState, useEffect } from 'react';
import gradeService from '../../services/gradeService';
import Loading from '../../components/Loading';

const ManageGrades = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    grade: '',
    grade_points: '',
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await gradeService.getAll();
      setGrades(data.grades || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch grades');
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
      if (editingGrade) {
        await gradeService.update(editingGrade.grade_id, formData);
      } else {
        await gradeService.create(formData);
      }
      setShowForm(false);
      setEditingGrade(null);
      resetForm();
      fetchGrades();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (grade) => {
    setEditingGrade(grade);
    setFormData({
      student_id: grade.student_id,
      course_id: grade.course_id,
      grade: grade.grade,
      grade_points: grade.grade_points,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grade?')) {
      try {
        await gradeService.delete(id);
        fetchGrades();
      } catch (err) {
        setError('Failed to delete grade');
      }
    }
  };

  const resetForm = () => {
    setFormData({ student_id: '', course_id: '', grade: '', grade_points: '' });
    setEditingGrade(null);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1>Manage Grades</h1>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} style={styles.addButton}>
          {showForm ? 'Cancel' : 'Add Grade'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingGrade ? 'Edit Grade' : 'Add Grade'}</h3>
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
                <label>Grade:</label>
                <select name="grade" value={formData.grade} onChange={handleInputChange} style={styles.input} required>
                  <option value="">Select Grade</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Grade Points:</label>
                <input type="number" step="0.01" name="grade_points" value={formData.grade_points} onChange={handleInputChange} style={styles.input} required />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>
              {editingGrade ? 'Update' : 'Create'} Grade
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
            <th style={styles.th}>Grade</th>
            <th style={styles.th}>Grade Points</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.grade_id}>
              <td style={styles.td}>{grade.grade_id}</td>
              <td style={styles.td}>{grade.student_id}</td>
              <td style={styles.td}>{grade.course_id}</td>
              <td style={styles.td}>
                <span style={{
                  ...styles.badge,
                  backgroundColor: ['A+', 'A', 'A-'].includes(grade.grade) ? '#27ae60' : ['B+', 'B', 'B-'].includes(grade.grade) ? '#3498db' : '#e74c3c'
                }}>
                  {grade.grade}
                </span>
              </td>
              <td style={styles.td}>{grade.grade_points}</td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(grade)} style={styles.editButton}>Edit</button>
                <button onClick={() => handleDelete(grade.grade_id)} style={styles.deleteButton}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {grades.length === 0 && <p style={styles.noData}>No grades found</p>}
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

export default ManageGrades;
