import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import attendanceService from '../services/attendanceService';
import gradeService from '../services/gradeService';
import enrollmentService from '../services/enrollmentService';
import studentService from '../services/studentService';
import courseService from '../services/courseService';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');
  const [enrollmentMessage, setEnrollmentMessage] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      console.log('User object:', user);
      
      // Get student info by user_id parameter
      const studentsData = await studentService.getAll({ user_id: user.user_id });
      const student = studentsData.students?.[0];
      
      console.log('Found student:', student);
      
      if (!student) {
        console.error('No student record found for user_id:', user.user_id);
        setLoading(false);
        return;
      }
      
      setStudentInfo(student);
      
      // Use student_id from the fetched student record
      const studentId = student.student_id;
      console.log('Using student_id:', studentId);
      
      // Fetch all courses
      const coursesData = await courseService.getAll();
      setCourses(coursesData.courses || []);
      console.log('Courses loaded:', coursesData.courses?.length);
      
      // Fetch attendance for this student using student_id parameter
      const attendanceData = await attendanceService.getAll({ student_id: studentId });
      setAttendance(attendanceData.attendance || []);
      console.log('Attendance records:', attendanceData.attendance?.length);
      
      // Fetch grades for this student using student_id parameter
      const gradesData = await gradeService.getAll({ student_id: studentId });
      setGrades(gradesData.grades || []);
      console.log('Grades:', gradesData.grades?.length);
      
      // Fetch enrollments for this student using student_id parameter
      const enrollmentsData = await enrollmentService.getAll({ student_id: studentId });
      setEnrollments(enrollmentsData.enrollments || []);
      console.log('Enrollments:', enrollmentsData.enrollments?.length);
      
      // Calculate available courses (department courses not yet enrolled in)
      const enrolledCourseIds = enrollmentsData.enrollments?.map(e => e.course_id) || [];
      const departmentCourses = coursesData.courses?.filter(c => 
        c.department_id === student.department_id && !enrolledCourseIds.includes(c.course_id)
      ) || [];
      setAvailableCourses(departmentCourses);
      console.log('Available courses:', departmentCourses.length);
    } catch (err) {
      console.error('Failed to fetch student data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      setEnrollmentMessage('');
      await enrollmentService.create({
        student_id: studentInfo.student_id,
        course_id: courseId,
        enrollment_date: new Date().toISOString().split('T')[0],
        semester: 'Spring 2025',
        is_active: true
      });
      setEnrollmentMessage('Successfully enrolled in course!');
      // Refresh data
      await fetchStudentData();
      setTimeout(() => setEnrollmentMessage(''), 3000);
    } catch (error) {
      setEnrollmentMessage('Failed to enroll in course');
      console.error('Enrollment error:', error);
    }
  };

  const getCourseInfo = (courseId) => {
    const course = courses.find(c => c.course_id === courseId);
    return course ? `${course.course_code} - ${course.course_name}` : `Course ${courseId}`;
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    return ((present / attendance.length) * 100).toFixed(2);
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 'N/A';
    const total = grades.reduce((sum, g) => sum + parseFloat(g.grade_points || 0), 0);
    return (total / grades.length).toFixed(2);
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={styles.container}>
          <div style={styles.main}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        {/* Left Sidebar Navigation */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Student Portal</h3>
          <p style={styles.studentName}>{user.first_name} {user.last_name}</p>
          <nav style={styles.nav}>
            <button
              onClick={() => setActiveSection('profile')}
              style={{...styles.navButton, ...(activeSection === 'profile' ? styles.navButtonActive : {})}}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveSection('courses')}
              style={{...styles.navButton, ...(activeSection === 'courses' ? styles.navButtonActive : {})}}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveSection('enroll')}
              style={{...styles.navButton, ...(activeSection === 'enroll' ? styles.navButtonActive : {})}}
            >
              Enroll in Courses
            </button>
            <button
              onClick={() => setActiveSection('attendance')}
              style={{...styles.navButton, ...(activeSection === 'attendance' ? styles.navButtonActive : {})}}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveSection('grades')}
              style={{...styles.navButton, ...(activeSection === 'grades' ? styles.navButtonActive : {})}}
            >
              Grades
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={styles.main}>
          <h1 style={styles.pageTitle}>
            {activeSection === 'profile' && 'My Profile'}
            {activeSection === 'courses' && 'My Courses'}
            {activeSection === 'enroll' && 'Enroll in Courses'}
            {activeSection === 'attendance' && 'Attendance Records'}
            {activeSection === 'grades' && 'My Grades'}
          </h1>

        {/* Profile Section */}
        {activeSection === 'profile' && (
        <div style={styles.section}>
          <h2>Profile Summary</h2>
          {studentInfo ? (
            <div style={styles.profileGrid}>
              <div style={styles.profileItem}>
                <strong>Student ID:</strong> {studentInfo.student_id}
              </div>
              <div style={styles.profileItem}>
                <strong>Email:</strong> {user.email}
              </div>
              <div style={styles.profileItem}>
                <strong>Year Level:</strong> {studentInfo.year_level}
              </div>
              <div style={styles.profileItem}>
                <strong>GPA:</strong> {studentInfo.gpa || calculateGPA()}
              </div>
              <div style={styles.profileItem}>
                <strong>Enrollment Date:</strong> {studentInfo.enrollment_date ? new Date(studentInfo.enrollment_date).toLocaleDateString() : 'N/A'}
              </div>
              <div style={styles.profileItem}>
                <strong>Attendance Rate:</strong> {calculateAttendancePercentage()}%
              </div>
            </div>
          ) : (
            <p>No student profile found</p>
          )}
        </div>

        )}

        {/* Courses Section */}
        {activeSection === 'courses' && (
        <div style={styles.section}>
          <h2>Enrolled Courses</h2>
          {enrollments.length > 0 ? (
            <>
              <p style={{ marginBottom: '15px', color: '#555' }}>
                Total Enrolled: <strong>{enrollments.length}</strong> course{enrollments.length !== 1 ? 's' : ''}
              </p>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course Code</th>
                    <th style={styles.th}>Course Name</th>
                    <th style={styles.th}>Credits</th>
                    <th style={styles.th}>Semester</th>
                    <th style={styles.th}>Enrollment Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const course = courses.find(c => c.course_id === enrollment.course_id);
                    const key = `${enrollment.student_id}-${enrollment.course_id}`;
                    return (
                      <tr key={key}>
                        <td style={styles.td}>{course?.course_code || 'N/A'}</td>
                        <td style={styles.td}>{course?.course_name || 'Unknown Course'}</td>
                        <td style={styles.td}>{course?.credits || 'N/A'}</td>
                        <td style={styles.td}>{course?.semester || enrollment.semester || 'N/A'}</td>
                        <td style={styles.td}>
                          {enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: enrollment.status === 'enrolled' ? '#27ae60' : enrollment.status === 'completed' ? '#3498db' : '#e74c3c'
                          }}>
                            {enrollment.status || 'enrolled'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>You haven't enrolled in any courses yet.</p>
              <p style={{ fontSize: '14px', color: '#888' }}>Click on "Enroll in Courses" to browse and enroll in available courses for your department.</p>
            </div>
          )}
        </div>

        )}

        {/* Enroll in Courses Section */}
        {activeSection === 'enroll' && (
        <div style={styles.section}>
          <h2>Available Courses for Your Department</h2>
          {enrollmentMessage && (
            <div style={{
              ...styles.message,
              backgroundColor: enrollmentMessage.includes('Failed') ? '#e74c3c' : '#27ae60'
            }}>
              {enrollmentMessage}
            </div>
          )}
          {!studentInfo ? (
            <p>Loading student information...</p>
          ) : !studentInfo.department_id ? (
            <p style={{ color: '#e74c3c' }}>No department assigned. Please contact the administrator.</p>
          ) : availableCourses.length > 0 ? (
            <>
              <p style={{ marginBottom: '15px', color: '#555' }}>
                Department: <strong>{studentInfo.department_id === 1 ? 'Computer Science' : studentInfo.department_id === 2 ? 'Electrical Engineering' : 'Mechanical Engineering'}</strong> | 
                Available Courses: <strong>{availableCourses.length}</strong> | 
                Enrolled: <strong>{enrollments.length}</strong>
              </p>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course Code</th>
                    <th style={styles.th}>Course Name</th>
                    <th style={styles.th}>Credits</th>
                    <th style={styles.th}>Semester</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableCourses.map((course) => (
                    <tr key={course.course_id}>
                      <td style={styles.td}>{course.course_code}</td>
                      <td style={styles.td}>{course.course_name}</td>
                      <td style={styles.td}>{course.credits}</td>
                      <td style={styles.td}>{course.semester}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleEnrollInCourse(course.course_id)}
                          style={styles.enrollButton}
                        >
                          Enroll
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : enrollments.length > 0 ? (
            <p style={{ color: '#27ae60' }}>You are already enrolled in all {enrollments.length} courses available for your department!</p>
          ) : (
            <p style={{ color: '#e74c3c' }}>No courses found for your department. Please contact the administrator.</p>
          )}
        </div>

        )}

        {/* Attendance Section */}
        {activeSection === 'attendance' && (
        <div style={styles.section}>
          <h2>My Attendance Summary</h2>
          {enrollments.length > 0 ? (
            <>
              <p style={{ marginBottom: '20px', color: '#555', fontSize: '15px' }}>
                Overall Attendance: <strong style={{ color: '#27ae60' }}>{calculateAttendancePercentage()}%</strong> | 
                Classes Attended: <strong>{attendance.filter(a => a.status === 'present' || a.status === 'late').length}</strong> out of <strong>{attendance.length}</strong>
              </p>
              
              {/* Course-wise Attendance Summary */}
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course</th>
                    <th style={styles.th}>Classes Held</th>
                    <th style={styles.th}>Classes Attended</th>
                    <th style={styles.th}>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const course = courses.find(c => c.course_id === enrollment.course_id);
                    const courseAttendance = attendance.filter(a => a.course_id === enrollment.course_id);
                    const attended = courseAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
                    const total = courseAttendance.length;
                    const percentage = total > 0 ? ((attended / total) * 100).toFixed(2) : 0;
                    const key = `${enrollment.student_id}-${enrollment.course_id}`;
                    
                    return (
                      <tr key={key}>
                        <td style={styles.td}>{course?.course_code || 'N/A'} - {course?.course_name || 'Unknown'}</td>
                        <td style={styles.td}>{total}</td>
                        <td style={styles.td}>{attended}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: percentage >= 75 ? '#27ae60' : percentage >= 50 ? '#f39c12' : '#e74c3c'
                          }}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>📅 No courses enrolled yet.</p>
              <p style={{ fontSize: '14px', color: '#888' }}>
                Enroll in courses to start tracking your attendance.
              </p>
            </div>
          )}
        </div>

        )}

        {/* Grades Section */}
        {activeSection === 'grades' && (
        <div style={styles.section}>
          <h2>My Grades</h2>
          {grades.length > 0 ? (
            <>
              <p style={{ marginBottom: '15px', color: '#555' }}>
                Courses Graded: <strong>{grades.length}</strong> | 
                Average Percentage: <strong>{(grades.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) / grades.length).toFixed(2)}%</strong>
              </p>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course</th>
                    <th style={styles.th}>Internal 1 (50)</th>
                    <th style={styles.th}>Internal 2 (50)</th>
                    <th style={styles.th}>Internal Avg</th>
                    <th style={styles.th}>External (50)</th>
                    <th style={styles.th}>Total (100)</th>
                    <th style={styles.th}>%</th>
                    <th style={styles.th}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => {
                    const key = `${grade.student_id}-${grade.course_id}`;
                    const internal1 = grade.internal1_marks !== null && grade.internal1_marks !== undefined ? parseFloat(grade.internal1_marks) : 0;
                    const internal2 = grade.internal2_marks !== null && grade.internal2_marks !== undefined ? parseFloat(grade.internal2_marks) : 0;
                    const internalAvg = (internal1 + internal2) / 2;
                    
                    return (
                      <tr key={key}>
                        <td style={styles.td}>{getCourseInfo(grade.course_id)}</td>
                        <td style={styles.td}>{grade.internal1_marks !== null && grade.internal1_marks !== undefined ? parseFloat(grade.internal1_marks).toFixed(2) : <em style={{color: '#999'}}>Not entered</em>}</td>
                        <td style={styles.td}>{grade.internal2_marks !== null && grade.internal2_marks !== undefined ? parseFloat(grade.internal2_marks).toFixed(2) : <em style={{color: '#999'}}>Not entered</em>}</td>
                        <td style={styles.td}>
                          <strong style={{color: '#3498db'}}>{internalAvg.toFixed(2)}</strong>
                        </td>
                        <td style={styles.td}>{grade.external_marks !== null && grade.external_marks !== undefined ? parseFloat(grade.external_marks).toFixed(2) : <em style={{color: '#999'}}>Not entered</em>}</td>
                        <td style={styles.td}>
                          <strong>{grade.total_marks !== null && grade.total_marks !== undefined ? parseFloat(grade.total_marks).toFixed(2) : 'N/A'}</strong>
                        </td>
                        <td style={styles.td}>{grade.percentage ? `${parseFloat(grade.percentage).toFixed(2)}%` : 'N/A'}</td>
                        <td style={styles.td}>
                          {grade.letter_grade ? (
                            <span style={{
                              ...styles.badge,
                              backgroundColor: 
                                ['A+', 'A', 'A-'].includes(grade.letter_grade) ? '#27ae60' : 
                                ['B+', 'B', 'B-'].includes(grade.letter_grade) ? '#3498db' :
                                ['C+', 'C', 'C-'].includes(grade.letter_grade) ? '#f39c12' :
                                grade.letter_grade === 'D' ? '#e67e22' : '#e74c3c'
                            }}>
                              {grade.letter_grade}
                            </span>
                          ) : (
                            <em style={{color: '#999'}}>Not graded</em>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <p style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>No grades available yet.</p>
              <p style={{ fontSize: '14px', color: '#888' }}>
                {enrollments.length === 0 
                  ? 'Enroll in courses to receive grades.' 
                  : 'Your faculty will add grades once evaluations are complete.'}
              </p>
            </div>
          )}
        </div>
        )}

        </main>
      </div>
    </div>
  );
};

const styles = {
  container: { 
    display: 'flex', 
    maxWidth: '1400px', 
    margin: '0 auto', 
    padding: '20px',
    gap: '20px',
    minHeight: 'calc(100vh - 80px)'
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#2c3e50',
    padding: '20px',
    borderRadius: '8px',
    height: 'fit-content',
    position: 'sticky',
    top: '20px'
  },
  sidebarTitle: {
    color: 'white',
    marginBottom: '10px',
    fontSize: '20px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px'
  },
  studentName: {
    color: '#ecf0f1',
    fontSize: '14px',
    marginBottom: '20px',
    fontStyle: 'italic'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  navButton: {
    padding: '12px 15px',
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '15px',
    transition: 'all 0.3s',
  },
  navButtonActive: {
    backgroundColor: '#3498db',
    fontWeight: 'bold'
  },
  main: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: '30px',
    borderRadius: '8px',
    minHeight: '500px'
  },
  pageTitle: {
    color: '#2c3e50',
    marginBottom: '30px',
    fontSize: '28px',
    borderBottom: '3px solid #3498db',
    paddingBottom: '10px'
  },
  section: { 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '8px', 
    marginBottom: '20px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
  },
  profileGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: '15px' 
  },
  profileItem: { 
    padding: '15px', 
    backgroundColor: '#ecf0f1', 
    borderRadius: '6px',
    border: '1px solid #bdc3c7'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    marginTop: '15px',
    backgroundColor: 'white'
  },
  th: { 
    backgroundColor: '#34495e', 
    color: 'white', 
    padding: '14px', 
    textAlign: 'left',
    fontWeight: '600'
  },
  td: { 
    padding: '12px', 
    borderBottom: '1px solid #ecf0f1' 
  },
  badge: { 
    padding: '5px 10px', 
    borderRadius: '4px', 
    color: 'white', 
    fontSize: '12px', 
    display: 'inline-block',
    fontWeight: '500'
  },
  enrollButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.3s'
  },
  message: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '15px',
    color: 'white',
    textAlign: 'center',
    fontWeight: '500'
  }
};

export default StudentDashboard;
