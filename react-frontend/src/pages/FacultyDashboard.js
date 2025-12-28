import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import attendanceService from '../services/attendanceService';
import gradeService from '../services/gradeService';
import enrollmentService from '../services/enrollmentService';
import studentService from '../services/studentService';
import courseService from '../services/courseService';
import facultyService from '../services/facultyService';
import userService from '../services/userService';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [facultyInfo, setFacultyInfo] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('attendance');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [gradeMarks, setGradeMarks] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});

  // Helper function to calculate letter grade from percentage
  const calculateLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D';
    return 'F';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('Faculty user object:', user);
      
      // Check if user has faculty_id (from auth login)
      if (!user.faculty_id) {
        console.error('No faculty_id found in user object');
        setLoading(false);
        return;
      }
      
      // Get faculty info by user_id
      const facultiesData = await facultyService.getAll();
      const faculty = facultiesData.faculty?.find(f => f.user_id === user.user_id);
      
      if (faculty) {
        setFacultyInfo(faculty);
        console.log('Faculty info loaded:', faculty);
        
        // Get courses assigned to this faculty member using faculty_id from user
        const facultyCoursesData = await facultyService.getCourses(user.faculty_id);
        setCourses(facultyCoursesData.courses || []);
        console.log('Faculty courses:', facultyCoursesData.courses?.length);
        
        // Fetch other data - use per_page=1000 to get all students
        const [attendanceData, gradesData, enrollmentsData, studentsData, usersData] = await Promise.all([
          attendanceService.getAll(),
          gradeService.getAll(),
          enrollmentService.getAll(),
          studentService.getAll({ per_page: 1000 }), // Fetch all students
          userService.getAll({ per_page: 1000 })      // Fetch all users
        ]);
        
        setAttendance(attendanceData.attendance || []);
        setGrades(gradesData.grades || []);
        setEnrollments(enrollmentsData.enrollments || []);
        setStudents(studentsData.students || []);
        setUsers(usersData.users || []);
        
        console.log('All data loaded successfully');
        console.log(`Loaded: ${studentsData.students?.length || 0} students, ${enrollmentsData.enrollments?.length || 0} enrollments`);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const getEnrolledStudents = (courseId) => {
    if (!courseId) return [];
    console.log('getEnrolledStudents called with courseId:', courseId, 'type:', typeof courseId);
    console.log('Total enrollments:', enrollments.length);
    console.log('Total students:', students.length);
    
    const enrolled = enrollments.filter(e => e.course_id === parseInt(courseId) && e.status === 'enrolled');
    console.log(`Found ${enrolled.length} enrollments for course ${courseId}`);
    
    if (enrolled.length > 0) {
      console.log('Sample enrollment:', enrolled[0]);
    }
    
    const result = enrolled.map(e => {
      const student = students.find(s => s.student_id === e.student_id);
      if (!student) {
        console.log(`Student not found for student_id: ${e.student_id}`);
      }
      return student ? { ...e, student } : null;
    }).filter(Boolean);
    
    console.log(`Returning ${result.length} enrolled students with student data`);
    return result;
  };

  const handleAttendanceChange = (key, status) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleMarkAttendance = async () => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    const enrolledStudents = getEnrolledStudents(selectedCourse);
    
    if (enrolledStudents.length === 0) {
      alert('No students enrolled in this course');
      return;
    }
    
    try {
      let markedCount = 0;
      for (const enrollment of enrolledStudents) {
        const key = `${enrollment.student_id}-${enrollment.course_id}`;
        const status = attendanceMarks[key] || 'present';
        const notes = attendanceNotes[key] || '';
        await attendanceService.create({
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          attendance_date: selectedDate,
          status: status,
          marked_by: facultyInfo.faculty_id,
          notes: notes
        });
        markedCount++;
      }
      alert(`Attendance marked successfully for ${markedCount} students on ${selectedDate}!`);
      setAttendanceMarks({});
      setAttendanceNotes({});
      fetchData();
    } catch (err) {
      alert('Failed to mark attendance: ' + err.message);
    }
  };

  const handleGradeChange = (key, field, value) => {
    setGradeMarks(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleAddGrade = async (studentId, courseId) => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    const key = `${studentId}-${courseId}`;
    const gradeData = gradeMarks[key];
    if (!gradeData || gradeData.internal1_marks === undefined || gradeData.internal2_marks === undefined || gradeData.external_marks === undefined) {
      alert('Please enter Internal 1 marks (0-50), Internal 2 marks (0-50), and External marks (0-50)');
      return;
    }

    try {
      await gradeService.create({
        student_id: studentId,
        course_id: courseId,
        internal1_marks: parseFloat(gradeData.internal1_marks) || 0,
        internal2_marks: parseFloat(gradeData.internal2_marks) || 0,
        external_marks: parseFloat(gradeData.external_marks) || 0
      });
      
      // Clear the input marks for this student-course
      setGradeMarks(prev => {
        const newMarks = { ...prev };
        delete newMarks[key];
        return newMarks;
      });
      
      // Fetch updated data
      await fetchData();
      
      alert('Grade added successfully!');
    } catch (err) {
      alert('Failed to add grade: ' + err.message);
    }
  };

  const handleUpdateGrade = async (studentId, courseId) => {
    const key = `${studentId}-${courseId}`;
    const gradeData = gradeMarks[key];
    if (!gradeData || gradeData.internal1_marks === undefined || gradeData.internal2_marks === undefined || gradeData.external_marks === undefined) {
      alert('Please enter all marks');
      return;
    }

    try {
      await gradeService.update(studentId, courseId, {
        internal1_marks: parseFloat(gradeData.internal1_marks) || 0,
        internal2_marks: parseFloat(gradeData.internal2_marks) || 0,
        external_marks: parseFloat(gradeData.external_marks) || 0
      });
      
      // Clear the input marks for this student-course
      setGradeMarks(prev => {
        const newMarks = { ...prev };
        delete newMarks[key];
        return newMarks;
      });
      
      // Fetch updated data
      await fetchData();
      
      alert('Grade updated successfully!');
    } catch (err) {
      alert('Failed to update grade: ' + err.message);
    }
  };

  const handleUpdateAttendance = async (studentId, courseId, attendanceDate) => {
    const key = `${studentId}-${courseId}-${attendanceDate}`;
    const status = editingAttendance[key]?.status;
    const notes = attendanceNotes[key];
    
    if (!status) {
      alert('Please select a status');
      return;
    }

    try {
      await attendanceService.update(studentId, courseId, attendanceDate.split('T')[0], {
        status: status,
        notes: notes || ''
      });
      alert('Attendance updated successfully!');
      setEditingAttendance(prev => {
        const newEditing = { ...prev };
        delete newEditing[key];
        return newEditing;
      });
      setAttendanceNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[key];
        return newNotes;
      });
      fetchData();
    } catch (err) {
      alert('Failed to update attendance: ' + err.message);
    }
  };

  const handleAttendanceStatusChange = (key, status) => {
    setEditingAttendance(prev => ({
      ...prev,
      [key]: { status }
    }));
  };

  const handleAttendanceNotesChange = (key, notes) => {
    setAttendanceNotes(prev => ({
      ...prev,
      [key]: notes
    }));
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.course_id === courseId);
    return course ? course.course_name : `Course ${courseId}`;
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

  const enrolledStudents = getEnrolledStudents(selectedCourse);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        {/* Left Sidebar Navigation */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Faculty Portal</h3>
          <p style={styles.facultyName}>{user.first_name} {user.last_name}</p>
          <nav style={styles.nav}>
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
            <button
              onClick={() => setActiveSection('viewStudents')}
              style={{...styles.navButton, ...(activeSection === 'viewStudents' ? styles.navButtonActive : {})}}
            >
              View Students
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={styles.main}>
          <h1 style={styles.pageTitle}>
            {activeSection === 'attendance' && 'Attendance Management'}
            {activeSection === 'grades' && 'Grade Management'}
            {activeSection === 'viewStudents' && 'Enrolled Students'}
          </h1>

          {/* Course Selection */}
          <div style={styles.courseSelection}>
            <label style={styles.label}>Select Course:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={styles.select}
            >
              <option value="">-- Choose a Course --</option>
              {courses.map(course => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Management Section */}
          {activeSection === 'attendance' && (
            <div style={styles.section}>
              <h2 style={{marginBottom: '20px'}}>Mark Attendance</h2>
              
              {/* Date Selection */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <label style={{ ...styles.label, display: 'block', marginBottom: '8px' }}>Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  style={styles.dateInput}
                />
              </div>

              {selectedCourse && (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #1abc9c' }}>
                    <p style={styles.info}>
                      Course: <strong>{getCourseName(parseInt(selectedCourse))}</strong>
                    </p>
                    <p style={styles.info}>
                      Enrolled Students: <strong>{enrolledStudents.length}</strong>
                    </p>
                    <p style={styles.info}>
                      📅 Date: <strong>{new Date(selectedDate).toLocaleDateString()}</strong>
                    </p>
                  </div>
                  
                  {enrolledStudents.length > 0 ? (
                    <>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>S.No</th>
                            <th style={styles.th}>Enrollment ID</th>
                            <th style={styles.th}>Student Name</th>
                            <th style={styles.th}>Enrollment Number</th>
                            <th style={styles.th}>Year Level</th>
                            <th style={styles.th}>Attendance Status</th>
                            <th style={styles.th}>Notes (Optional)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledStudents.map((enrollment, index) => {
                            const studentUser = users.find(u => u.user_id === enrollment.student?.user_id);
                            const studentName = studentUser 
                              ? `${studentUser.first_name} ${studentUser.last_name}` 
                              : 'Unknown';
                            
                            const key = `${enrollment.student_id}-${enrollment.course_id}`;
                            return (
                              <tr key={key}>
                                <td style={styles.td}>{index + 1}</td>
                                <td style={styles.td}>{enrollment.student_id}-{enrollment.course_id}</td>
                                <td style={styles.td}><strong>{studentName}</strong></td>
                                <td style={styles.td}>{enrollment.student_enrollment_number || 'N/A'}</td>
                                <td style={styles.td}>{enrollment.semester || 'N/A'}</td>
                                <td style={styles.td}>
                                  <select
                                    value={attendanceMarks[key] || 'present'}
                                    onChange={(e) => handleAttendanceChange(key, e.target.value)}
                                    style={styles.statusSelect}
                                  >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="excused">Excused</option>
                                  </select>
                                </td>
                                <td style={styles.td}>
                                  <input
                                    type="text"
                                    value={attendanceNotes[key] || ''}
                                    onChange={(e) => handleAttendanceNotesChange(key, e.target.value)}
                                    placeholder="Add notes..."
                                    style={{...styles.gradeInput, width: '150px'}}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <button onClick={handleMarkAttendance} style={styles.submitButton}>
                        Mark Attendance for {enrolledStudents.length} Students
                      </button>
                    </>
                  ) : (
                    <p style={styles.noData}>No students enrolled in this course</p>
                  )}
                </>
              )}

              {!selectedCourse && (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to mark attendance</p>
                </div>
              )}
            </div>
          )}

          {/* Add Grades Section */}
          {activeSection === 'grades' && (
            <div style={styles.section}>
              <h2>Update Grades for Students</h2>
              {selectedCourse ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #1abc9c' }}>
                    <p style={styles.info}>
                      Course: <strong>{getCourseName(parseInt(selectedCourse))}</strong>
                    </p>
                    <p style={styles.info}>
                      Enrolled Students: <strong>{enrolledStudents.length}</strong>
                    </p>
                  </div>
                  
                  {enrolledStudents.length > 0 ? (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>S.No</th>
                          <th style={styles.th}>Student Name</th>
                          <th style={styles.th}>Enrollment Number</th>
                          <th style={styles.th}>Internal 1 (50)</th>
                          <th style={styles.th}>Internal 2 (50)</th>
                          <th style={styles.th}>External (50)</th>
                          <th style={styles.th}>Total (100)</th>
                          <th style={styles.th}>Grade</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledStudents.map((enrollment, index) => {
                          const studentUser = users.find(u => u.user_id === enrollment.student_first_name ? {user_id: enrollment.student_id} : enrollment.student?.user_id);
                          const studentName = enrollment.student_first_name 
                            ? `${enrollment.student_first_name} ${enrollment.student_last_name}` 
                            : (studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : 'Unknown');
                          
                          const key = `${enrollment.student_id}-${enrollment.course_id}`;
                          // Find existing grade for this student-course
                          const existingGrade = grades.find(g => g.student_id === enrollment.student_id && g.course_id === enrollment.course_id);
                          
                          // Calculate Total Marks in real-time (Average of 2 internals + External = Total out of 100)
                          const internal1Marks = gradeMarks[key]?.internal1_marks ?? existingGrade?.internal1_marks ?? 0;
                          const internal2Marks = gradeMarks[key]?.internal2_marks ?? existingGrade?.internal2_marks ?? 0;
                          const externalMarks = gradeMarks[key]?.external_marks ?? existingGrade?.external_marks ?? 0;
                          const internalAvg = (parseFloat(internal1Marks) + parseFloat(internal2Marks)) / 2;
                          const totalMarks = (internalAvg + parseFloat(externalMarks)).toFixed(2);
                          const percentage = parseFloat(totalMarks);
                          const currentLetterGrade = calculateLetterGrade(percentage);
                          
                          return (
                            <tr key={key}>
                              <td style={styles.td}>{index + 1}</td>
                              <td style={styles.td}><strong>{studentName}</strong></td>
                              <td style={styles.td}>{enrollment.student_enrollment_number || 'N/A'}</td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.5"
                                  value={gradeMarks[key]?.internal1_marks ?? (existingGrade?.internal1_marks || '')}
                                  onChange={(e) => handleGradeChange(key, 'internal1_marks', e.target.value)}
                                  style={styles.gradeInput}
                                  placeholder="0-50"
                                />
                              </td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.5"
                                  value={gradeMarks[key]?.internal2_marks ?? (existingGrade?.internal2_marks || '')}
                                  onChange={(e) => handleGradeChange(key, 'internal2_marks', e.target.value)}
                                  style={styles.gradeInput}
                                  placeholder="0-50"
                                />
                              </td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  step="0.5"
                                  value={gradeMarks[key]?.external_marks ?? (existingGrade?.external_marks || '')}
                                  onChange={(e) => handleGradeChange(key, 'external_marks', e.target.value)}
                                  style={styles.gradeInput}
                                  placeholder="0-50"
                                />
                              </td>
                              <td style={styles.td}>
                                <strong style={{fontSize: '16px', color: '#2c3e50'}}>{totalMarks}</strong>
                                <br />
                                <small style={{color: '#7f8c8d'}}>Auto-calc</small>
                              </td>
                              <td style={styles.td}>
                                <div>
                                  <strong style={{
                                    fontSize: '18px',
                                    color: ['A+', 'A', 'A-'].includes(currentLetterGrade) ? '#27ae60' :
                                           ['B+', 'B', 'B-'].includes(currentLetterGrade) ? '#3498db' :
                                           ['C+', 'C', 'C-'].includes(currentLetterGrade) ? '#f39c12' :
                                           currentLetterGrade === 'D' ? '#e67e22' : '#e74c3c'
                                  }}>
                                    {currentLetterGrade}
                                  </strong>
                                  <br />
                                  <small style={{color: '#7f8c8d'}}>{percentage.toFixed(2)}%</small>
                                </div>
                              </td>
                              <td style={styles.td}>
                                {existingGrade ? (
                                  <button
                                    onClick={() => handleUpdateGrade(enrollment.student_id, enrollment.course_id)}
                                    style={{...styles.addButton, backgroundColor: '#f39c12'}}
                                  >
                                    Update
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAddGrade(enrollment.student_id, enrollment.course_id)}
                                    style={styles.addButton}
                                  >
                                    Add Grade
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={styles.noData}>No students enrolled in this course</p>
                  )}
                </>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to update grades</p>
                </div>
              )}
            </div>
          )}

          {/* View Students Section */}
          {activeSection === 'viewStudents' && (
            <div style={styles.section}>
              <h2>View Enrolled Students - Attendance & Grades</h2>
              {selectedCourse ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #1abc9c' }}>
                    <p style={styles.info}>
                      Course: <strong>{getCourseName(parseInt(selectedCourse))}</strong>
                    </p>
                    <p style={styles.info}>
                      Total Enrolled: <strong>{enrolledStudents.length}</strong>
                    </p>
                  </div>
                  
                  {enrolledStudents.length > 0 ? (
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>S.No</th>
                          <th style={styles.th}>Student Name</th>
                          <th style={styles.th}>Enrollment Number</th>
                          <th style={styles.th}>Year Level</th>
                          <th style={styles.th}>Attendance</th>
                          <th style={styles.th}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledStudents.map((enrollment, index) => {
                          const studentUser = users.find(u => u.user_id === enrollment.student?.user_id);
                          const studentName = studentUser 
                            ? `${studentUser.first_name} ${studentUser.last_name}` 
                            : 'Unknown';
                          
                          // Calculate attendance for this student in this course
                          const studentAttendance = attendance.filter(
                            a => a.student_id === enrollment.student_id && a.course_id === enrollment.course_id
                          );
                          const totalClasses = studentAttendance.length;
                          const presentClasses = studentAttendance.filter(
                            a => a.status === 'present' || a.status === 'late'
                          ).length;
                          const attendancePercentage = totalClasses > 0 
                            ? ((presentClasses / totalClasses) * 100).toFixed(1)
                            : 0;
                          
                          // Find grade for this student-course
                          const studentGrade = grades.find(g => g.student_id === enrollment.student_id && g.course_id === enrollment.course_id);
                          const key = `${enrollment.student_id}-${enrollment.course_id}`;
                          
                          return (
                            <tr key={key}>
                              <td style={styles.td}>{index + 1}</td>
                              <td style={styles.td}><strong>{studentName}</strong></td>
                              <td style={styles.td}>{enrollment.student?.enrollment_number || 'N/A'}</td>
                              <td style={styles.td}>{enrollment.student?.year_level || 'N/A'}</td>
                              <td style={styles.td}>
                                <div>
                                  <strong style={{
                                    color: attendancePercentage >= 75 ? '#27ae60' : 
                                           attendancePercentage >= 50 ? '#f39c12' : '#e74c3c'
                                  }}>
                                    {attendancePercentage}%
                                  </strong>
                                  <br />
                                  <small style={{color: '#7f8c8d'}}>
                                    {presentClasses}/{totalClasses} classes
                                  </small>
                                </div>
                              </td>
                              <td style={styles.td}>
                                {studentGrade ? (
                                  <div>
                                    <strong style={{
                                      fontSize: '18px',
                                      color: studentGrade.letter_grade === 'A' ? '#27ae60' :
                                             studentGrade.letter_grade === 'B' ? '#2ecc71' :
                                             studentGrade.letter_grade === 'C' ? '#f39c12' :
                                             studentGrade.letter_grade === 'D' ? '#e67e22' :
                                             '#e74c3c'
                                    }}>
                                      {studentGrade.letter_grade}
                                    </strong>
                                    <br />
                                    <small style={{color: '#7f8c8d'}}>
                                      {parseFloat(studentGrade.percentage || 0).toFixed(2)}%
                                    </small>
                                    <br />
                                    <small style={{color: '#95a5a6'}}>
                                      {studentGrade.ia_marks !== null && studentGrade.assignment_marks !== null ? (
                                        <>
                                          IA: {studentGrade.ia_marks} | 
                                          Assgn: {studentGrade.assignment_marks} | 
                                          Final IA: {studentGrade.final_ia_marks ? parseFloat(studentGrade.final_ia_marks).toFixed(2) : 'N/A'} | 
                                          Ext: {studentGrade.external_marks ? (parseFloat(studentGrade.external_marks) * 2).toFixed(2) : 'N/A'}
                                        </>
                                      ) : (
                                        'Marks not entered yet'
                                      )}
                                    </small>
                                  </div>
                                ) : (
                                  <span style={{color: '#999'}}>Not graded</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={styles.noData}>No students enrolled in this course</p>
                  )}
                </>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to view students</p>
                </div>
              )}
            </div>
          )}

          {/* View Grades Section */}
          {activeSection === 'viewGrades' && (
            <div style={styles.section}>
              <h2>All Grade Records</h2>
              {selectedCourse ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #1abc9c' }}>
                    <p style={styles.info}>
                      Course: <strong>{getCourseName(parseInt(selectedCourse))}</strong>
                    </p>
                  </div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>Enrollment Number</th>
                        <th style={styles.th}>Internal (30)</th>
                        <th style={styles.th}>Midterm (30)</th>
                        <th style={styles.th}>Final (40)</th>
                        <th style={styles.th}>Total (100)</th>
                        <th style={styles.th}>Percentage</th>
                        <th style={styles.th}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades
                        .filter(grade => grade.course_id === parseInt(selectedCourse))
                        .sort((a, b) => b.percentage - a.percentage)
                        .map((grade) => {
                          const student = students.find(s => s.student_id === grade.student_id);
                          const studentUser = student ? users.find(u => u.user_id === student.user_id) : null;
                          const studentName = studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : 'Unknown';
                          
                          const key = `${grade.student_id}-${grade.course_id}`;
                          return (
                            <tr key={key}>
                              <td style={styles.td}><strong>{studentName}</strong></td>
                              <td style={styles.td}>{student?.enrollment_number || 'N/A'}</td>
                              <td style={styles.td}>{grade.internal_marks?.toFixed(2) || '0.00'}</td>
                              <td style={styles.td}>{grade.midterm_marks?.toFixed(2) || '0.00'}</td>
                              <td style={styles.td}>{grade.final_marks?.toFixed(2) || '0.00'}</td>
                              <td style={styles.td}><strong>{grade.total_marks?.toFixed(2) || '0.00'}</strong></td>
                              <td style={styles.td}>{parseFloat(grade.percentage || 0).toFixed(2)}%</td>
                              <td style={styles.td}>
                                <span style={{
                                  ...styles.badge,
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  backgroundColor: 
                                    ['A+', 'A', 'A-'].includes(grade.letter_grade) ? '#27ae60' : 
                                    ['B+', 'B', 'B-'].includes(grade.letter_grade) ? '#2ecc71' :
                                    ['C+', 'C', 'C-'].includes(grade.letter_grade) ? '#f39c12' :
                                    grade.letter_grade === 'D' ? '#e67e22' : '#e74c3c'
                                }}>
                                  {grade.letter_grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to view grades</p>
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
    backgroundColor: '#16a085',
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
    borderBottom: '2px solid #1abc9c',
    paddingBottom: '10px'
  },
  facultyName: {
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
    backgroundColor: '#1abc9c',
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
    marginBottom: '20px',
    fontSize: '28px',
    borderBottom: '3px solid #16a085',
    paddingBottom: '10px'
  },
  courseSelection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  label: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: '15px'
  },
  select: {
    padding: '10px 15px',
    fontSize: '15px',
    border: '2px solid #16a085',
    borderRadius: '4px',
    minWidth: '300px',
    cursor: 'pointer'
  },
  section: { 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '8px', 
    marginBottom: '20px', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
  },
  info: {
    fontSize: '15px',
    color: '#34495e',
    marginBottom: '10px'
  },
  noData: {
    textAlign: 'center',
    padding: '30px',
    color: '#7f8c8d',
    fontSize: '16px'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    marginTop: '20px',
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
  statusSelect: {
    padding: '8px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    width: '120px'
  },
  dateInput: {
    padding: '10px 15px',
    border: '2px solid #1abc9c',
    borderRadius: '6px',
    fontSize: '15px',
    width: '200px',
    fontWeight: '500'
  },
  gradeInput: {
    padding: '8px 12px',
    border: '1px solid #bdc3c7',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100px'
  },
  submitButton: {
    marginTop: '20px',
    padding: '12px 30px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  badge: { 
    padding: '5px 10px', 
    borderRadius: '4px', 
    color: 'white', 
    fontSize: '12px', 
    display: 'inline-block',
    fontWeight: '500'
  },
  tabButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s'
  },
};

export default FacultyDashboard;
