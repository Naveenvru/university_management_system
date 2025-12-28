import React, { useState, useEffect } from 'react';
import courseService from '../../services/courseService';
import departmentService from '../../services/departmentService';
import facultyService from '../../services/facultyService';
import Loading from '../../components/Loading';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    department_id: '',
    faculty_id: '',
    semester: '',
    credits: 3,
    max_students: 60,
    total_classes: 45,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesData, deptData, facultyData] = await Promise.all([
        courseService.getAll(),
        departmentService.getAll(),
        facultyService.getAll()
      ]);
      setCourses(coursesData.courses || []);
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        department_id: parseInt(formData.department_id),
        faculty_id: parseInt(formData.faculty_id),
        credits: parseInt(formData.credits),
        max_students: parseInt(formData.max_students),
        total_classes: parseInt(formData.total_classes),
      };
      
      if (editingCourse) {
        await courseService.update(editingCourse.course_id, submitData);
      } else {
        await courseService.create(submitData);
      }
      setShowForm(false);
      setEditingCourse(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      department_id: course.department_id,
      faculty_id: course.faculty_id,
      semester: course.semester,
      credits: course.credits,
      max_students: course.max_students,
      total_classes: course.total_classes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseService.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      course_code: '',
      course_name: '',
      department_id: '',
      faculty_id: '',
      semester: '',
      credits: 3,
      max_students: 60,
      total_classes: 45,
    });
    setEditingCourse(null);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.department_id === deptId);
    return dept ? dept.department_name : 'Unknown';
  };

  const getFacultyName = (facultyId) => {
    const faculty = faculties.find(f => f.faculty_id === facultyId);
    return faculty ? `${faculty.first_name} ${faculty.last_name}` : 'Unassigned';
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={styles.header}>
        <h1>Manage Courses</h1>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} style={styles.addButton}>
          {showForm ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.formContainer}>
          <h3>{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Course Code:</label>
                <input
                  type="text"
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., CS101"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Course Name:</label>
                <input
                  type="text"
                  name="course_name"
                  value={formData.course_name}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., Introduction to Programming"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Department:</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_code} - {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label>Faculty:</label>
                <select
                  name="faculty_id"
                  value={formData.faculty_id}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select Faculty</option>
                  {faculties.map(faculty => (
                    <option key={faculty.faculty_id} value={faculty.faculty_id}>
                      {faculty.first_name} {faculty.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Semester:</label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="e.g., Fall 2024"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Credits:</label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  min="1"
                  max="10"
                />
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label>Max Students:</label>
                <input
                  type="number"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  min="1"
                />
              </div>
              <div style={styles.formGroup}>
                <label>Total Classes:</label>
                <input
                  type="number"
                  name="total_classes"
                  value={formData.total_classes}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  min="1"
                />
              </div>
            </div>
            <button type="submit" style={styles.submitButton}>
              {editingCourse ? 'Update' : 'Create'} Course
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
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Faculty</th>
              <th style={styles.th}>Semester</th>
              <th style={styles.th}>Credits</th>
              <th style={styles.th}>Max Students</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.course_id} style={styles.tr}>
                <td style={styles.td}>{course.course_id}</td>
                <td style={styles.td}><strong>{course.course_code}</strong></td>
                <td style={styles.td}>{course.course_name}</td>
                <td style={styles.td}>{getDepartmentName(course.department_id)}</td>
                <td style={styles.td}>{getFacultyName(course.faculty_id)}</td>
                <td style={styles.td}>{course.semester}</td>
                <td style={styles.td}>{course.credits}</td>
                <td style={styles.td}>{course.max_students}</td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(course)} style={styles.editButton}>Edit</button>
                  <button onClick={() => handleDelete(course.course_id)} style={styles.deleteButton}>Delete</button>
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

export default ManageCourses;
