import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import departmentService from '../services/departmentService';

const Signup = () => {
  const [formData, setFormData] = useState({
    // User fields
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    date_of_birth: '',
    // Student fields
    enrollment_number: '',
    department_id: '',
    semester: '1',
    batch: '',
    admission_date: '',
    // Faculty fields
    designation: '',
    qualification: '',
    joining_date: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.enrollment_number || !formData.department_id || !formData.batch || !formData.admission_date) {
        setError('Please fill in all student-specific fields (enrollment number, department, batch, admission date)');
        return;
      }
    }

    if (formData.role === 'faculty') {
      if (!formData.department_id || !formData.designation || !formData.qualification || !formData.joining_date) {
        setError('Please fill in all faculty-specific fields (department, designation, qualification, joining date)');
        return;
      }
    }

    setLoading(true);
    
    try {
      await userService.create(formData);
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.signupBox}>
        <h1 style={styles.title}>University Management System</h1>
        <h2 style={styles.subtitle}>Create Account</h2>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name: *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter first name"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name: *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email: *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password: *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter password (min 6 characters)"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Role: *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter phone number"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date of Birth:</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <>
              <div style={{borderTop: '2px solid #3498db', paddingTop: '20px', marginTop: '10px', marginBottom: '20px'}}>
                <h3 style={{color: '#3498db', marginBottom: '15px'}}>Student Information</h3>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Enrollment Number: *</label>
                  <input
                    type="text"
                    name="enrollment_number"
                    value={formData.enrollment_number}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="e.g., 2024-CS-001"
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Department: *</label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Semester: *</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                    <option value="7">7th Semester</option>
                    <option value="8">8th Semester</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Batch: *</label>
                  <input
                    type="text"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="e.g., 2024-2028"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Admission Date: *</label>
                <input
                  type="date"
                  name="admission_date"
                  value={formData.admission_date}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </>
          )}

          {/* Faculty-specific fields */}
          {formData.role === 'faculty' && (
            <>
              <div style={{borderTop: '2px solid #e67e22', paddingTop: '20px', marginTop: '10px', marginBottom: '20px'}}>
                <h3 style={{color: '#e67e22', marginBottom: '15px'}}>Faculty Information</h3>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Department: *</label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Designation: *</label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Designation</option>
                    <option value="professor">Professor</option>
                    <option value="associate_professor">Associate Professor</option>
                    <option value="assistant_professor">Assistant Professor</option>
                    <option value="lecturer">Lecturer</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Joining Date: *</label>
                  <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Qualification: *</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Ph.D. in Computer Science"
                  required
                />
              </div>
            </>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.loginLink}>
          <p>Already have an account? <Link to="/login" style={styles.link}>Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#ecf0f1',
    padding: '20px',
  },
  signupBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '10px',
    fontSize: '24px',
  },
  subtitle: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: '30px',
    fontSize: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  },
  error: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
    textAlign: 'center',
  },
  loginLink: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#7f8c8d',
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

export default Signup;
