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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get faculty info by user_id
      const facultiesData = await facultyService.getAll();
      const faculty = facultiesData.faculty?.find(f => f.user_id === user.user_id);
      
      if (faculty) {
        setFacultyInfo(faculty);
        
        // Get courses assigned to this faculty member
        const facultyCoursesData = await facultyService.getCourses(faculty.faculty_id);
        setCourses(facultyCoursesData.courses || []);
        
        // Fetch other data
        const [attendanceData, gradesData, enrollmentsData, studentsData, usersData] = await Promise.all([
          attendanceService.getAll(),
          gradeService.getAll(),
          enrollmentService.getAll(),
          studentService.getAll(),
          userService.getAll()
        ]);
        
        setAttendance(attendanceData.attendance || []);
        setGrades(gradesData.grades || []);
        setEnrollments(enrollmentsData.enrollments || []);
        setStudents(studentsData.students || []);
        setUsers(usersData.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const getEnrolledStudents = (courseId) => {
    if (!courseId) return [];
    const enrolled = enrollments.filter(e => e.course_id === parseInt(courseId) && e.status === 'enrolled');
    return enrolled.map(e => {
      const student = students.find(s => s.student_id === e.student_id);
      return student ? { ...e, student } : null;
    }).filter(Boolean);
  };

  const handleAttendanceChange = (enrollmentId, status) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [enrollmentId]: status
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
        const status = attendanceMarks[enrollment.enrollment_id] || 'present';
        const notes = attendanceNotes[enrollment.enrollment_id] || '';
        await attendanceService.create({
          enrollment_id: enrollment.enrollment_id,
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

  const handleGradeChange = (enrollmentId, field, value) => {
    setGradeMarks(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [field]: value
      }
    }));
  };

  const handleAddGrade = async (enrollmentId) => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    const gradeData = gradeMarks[enrollmentId];
    if (!gradeData || gradeData.ia_marks === undefined || gradeData.assignment_marks === undefined || gradeData.external_marks === undefined) {
      alert('Please enter IA marks (0-30), assignment marks (0-20), and external marks (0-100)');
      return;
    }

    try {
      await gradeService.create({
        enrollment_id: enrollmentId,
        ia_marks: parseFloat(gradeData.ia_marks) || 0,
        assignment_marks: parseFloat(gradeData.assignment_marks) || 0,
        external_marks: parseFloat(gradeData.external_marks) || 0
      });
      
      // Clear the input marks for this enrollment
      setGradeMarks(prev => {
        const newMarks = { ...prev };
        delete newMarks[enrollmentId];
        return newMarks;
      });
      
      // Fetch updated data
      await fetchData();
      
      alert('Grade added successfully!');
    } catch (err) {
      alert('Failed to add grade: ' + err.message);
    }
  };

  const handleUpdateGrade = async (gradeId, enrollmentId) => {
    const gradeData = gradeMarks[enrollmentId];
    if (!gradeData || gradeData.ia_marks === undefined || gradeData.assignment_marks === undefined || gradeData.external_marks === undefined) {
      alert('Please enter all marks');
      return;
    }

    try {
      await gradeService.update(gradeId, {
        ia_marks: parseFloat(gradeData.ia_marks) || 0,
        assignment_marks: parseFloat(gradeData.assignment_marks) || 0,
        external_marks: parseFloat(gradeData.external_marks) || 0
      });
      
      // Clear the input marks for this enrollment
      setGradeMarks(prev => {
        const newMarks = { ...prev };
        delete newMarks[enrollmentId];
        return newMarks;
      });
      
      // Fetch updated data
      await fetchData();
      
      alert('Grade updated successfully!');
    } catch (err) {
      alert('Failed to update grade: ' + err.message);
    }
  };

  const handleUpdateAttendance = async (attendanceId) => {
    const status = editingAttendance[attendanceId]?.status;
    const notes = attendanceNotes[attendanceId];
    
    if (!status) {
      alert('Please select a status');
      return;
    }

    try {
      await attendanceService.update(attendanceId, {
        status: status,
        notes: notes || ''
      });
      alert('Attendance updated successfully!');
      setEditingAttendance(prev => {
        const newEditing = { ...prev };
        delete newEditing[attendanceId];
        return newEditing;
      });
      setAttendanceNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[attendanceId];
        return newNotes;
      });
      fetchData();
    } catch (err) {
      alert('Failed to update attendance: ' + err.message);
    }
  };

  const handleAttendanceStatusChange = (attendanceId, status) => {
    setEditingAttendance(prev => ({
      ...prev,
      [attendanceId]: { status }
    }));
  };

  const handleAttendanceNotesChange = (attendanceId, notes) => {
    setAttendanceNotes(prev => ({
      ...prev,
      [attendanceId]: notes
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
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2>Attendance Management</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={() => setActiveSection('attendance-mark')}
                    style={{...styles.tabButton, backgroundColor: activeSection === 'attendance-mark' ? '#1abc9c' : '#ecf0f1', color: activeSection === 'attendance-mark' ? 'white' : '#34495e'}}
                  >
                    Mark New
                  </button>
                  <button
                    onClick={() => setActiveSection('attendance-update')}
                    style={{...styles.tabButton, backgroundColor: activeSection === 'attendance-update' ? '#1abc9c' : '#ecf0f1', color: activeSection === 'attendance-update' ? 'white' : '#34495e'}}
                  >
                    Update Records
                  </button>
                </div>
              </div>
              
              {/* Mark New Attendance */}
              {(activeSection === 'attendance' || activeSection === 'attendance-mark') && (
                <>
                  <h3 style={{color: '#16a085', marginBottom: '15px'}}>Mark New Attendance</h3>
                  
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
                </>
              )}

              {(activeSection === 'attendance' || activeSection === 'attendance-mark') && selectedCourse && (
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
                            
                            return (
                              <tr key={enrollment.enrollment_id}>
                                <td style={styles.td}>{index + 1}</td>
                                <td style={styles.td}>{enrollment.enrollment_id}</td>
                                <td style={styles.td}><strong>{studentName}</strong></td>
                                <td style={styles.td}>{enrollment.student?.enrollment_number || 'N/A'}</td>
                                <td style={styles.td}>{enrollment.student?.year_level || 'N/A'}</td>
                                <td style={styles.td}>
                                  <select
                                    value={attendanceMarks[enrollment.enrollment_id] || 'present'}
                                    onChange={(e) => handleAttendanceChange(enrollment.enrollment_id, e.target.value)}
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
                                    value={attendanceNotes[enrollment.enrollment_id] || ''}
                                    onChange={(e) => handleAttendanceNotesChange(enrollment.enrollment_id, e.target.value)}
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

              {(activeSection === 'attendance' || activeSection === 'attendance-mark') && !selectedCourse && (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to mark attendance</p>
                </div>
              )}

              {/* Update Attendance Records */}
              {activeSection === 'attendance-update' && (
                <>
                  <h3 style={{color: '#16a085', marginBottom: '15px'}}>Update Attendance Records</h3>
                  {selectedCourse ? (
                    <>
                      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #1abc9c' }}>
                        <p style={styles.info}>
                          Course: <strong>{getCourseName(parseInt(selectedCourse))}</strong>
                        </p>
                        <p style={{fontSize: '14px', color: '#7f8c8d', marginTop: '10px'}}>
                          Tip: You can update the status and add notes for any attendance record
                        </p>
                      </div>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Student Name</th>
                            <th style={styles.th}>Enrollment Number</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Notes</th>
                            <th style={styles.th}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance
                            .filter(record => record.course_id === parseInt(selectedCourse))
                            .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date))
                            .slice(0, 50)
                            .map((record) => {
                              const enrollment = enrollments.find(e => e.enrollment_id === record.enrollment_id);
                              const student = enrollment ? students.find(s => s.student_id === enrollment.student_id) : null;
                              const studentUser = student ? users.find(u => u.user_id === student.user_id) : null;
                              const studentName = studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : 'Unknown';
                              
                              return (
                                <tr key={record.attendance_id}>
                                  <td style={styles.td}><strong>{studentName}</strong></td>
                                  <td style={styles.td}>{student?.enrollment_number || 'N/A'}</td>
                                  <td style={styles.td}>{new Date(record.attendance_date).toLocaleDateString()}</td>
                                  <td style={styles.td}>
                                    <select
                                      value={editingAttendance[record.attendance_id]?.status || record.status}
                                      onChange={(e) => handleAttendanceStatusChange(record.attendance_id, e.target.value)}
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
                                      value={attendanceNotes[record.attendance_id] ?? (record.notes || '')}
                                      onChange={(e) => handleAttendanceNotesChange(record.attendance_id, e.target.value)}
                                      placeholder="Add notes..."
                                      style={{...styles.gradeInput, width: '150px'}}
                                    />
                                  </td>
                                  <td style={styles.td}>
                                    <button
                                      onClick={() => handleUpdateAttendance(record.attendance_id)}
                                      style={{...styles.addButton, backgroundColor: '#f39c12'}}
                                    >
                                      Update
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to view attendance</p>
                    </div>
                  )}
                </>
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
                          <th style={styles.th}>IA Marks (30)</th>
                          <th style={styles.th}>Assignment (20)</th>
                          <th style={styles.th}>Final IA (50)</th>
                          <th style={styles.th}>External (100)</th>
                          <th style={styles.th}>Total (100)</th>
                          <th style={styles.th}>Grade</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledStudents.map((enrollment, index) => {
                          const studentUser = users.find(u => u.user_id === enrollment.student?.user_id);
                          const studentName = studentUser 
                            ? `${studentUser.first_name} ${studentUser.last_name}` 
                            : 'Unknown';
                          
                          // Find existing grade for this enrollment
                          const existingGrade = grades.find(g => g.enrollment_id === enrollment.enrollment_id);
                          
                          // Calculate Final IA in real-time for display (simple addition)
                          const iaMarks = gradeMarks[enrollment.enrollment_id]?.ia_marks ?? existingGrade?.ia_marks;
                          const assignmentMarks = gradeMarks[enrollment.enrollment_id]?.assignment_marks ?? existingGrade?.assignment_marks;
                          const finalIA = (iaMarks !== null && iaMarks !== undefined && assignmentMarks !== null && assignmentMarks !== undefined) 
                            ? (parseFloat(iaMarks) + parseFloat(assignmentMarks)).toFixed(2) 
                            : (existingGrade?.final_ia_marks ? parseFloat(existingGrade.final_ia_marks).toFixed(2) : '-');
                          
                          // Calculate Total Marks in real-time (Final IA + External stored)
                          const externalInput = gradeMarks[enrollment.enrollment_id]?.external_marks ?? (existingGrade?.external_marks ? existingGrade.external_marks * 2 : null);
                          const externalStored = externalInput ? parseFloat(externalInput) / 2 : existingGrade?.external_marks;
                          const totalMarks = (finalIA !== '-' && externalStored !== null && externalStored !== undefined) 
                            ? (parseFloat(finalIA) + parseFloat(externalStored)).toFixed(2) 
                            : (existingGrade?.total_marks ? parseFloat(existingGrade.total_marks).toFixed(2) : '-');
                          
                          return (
                            <tr key={enrollment.enrollment_id}>
                              <td style={styles.td}>{index + 1}</td>
                              <td style={styles.td}><strong>{studentName}</strong></td>
                              <td style={styles.td}>{enrollment.student?.enrollment_number || 'N/A'}</td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  step="0.5"
                                  value={gradeMarks[enrollment.enrollment_id]?.ia_marks ?? (existingGrade?.ia_marks || '')}
                                  onChange={(e) => handleGradeChange(enrollment.enrollment_id, 'ia_marks', e.target.value)}
                                  style={styles.gradeInput}
                                  placeholder="0-30"
                                />
                              </td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  value={gradeMarks[enrollment.enrollment_id]?.assignment_marks ?? (existingGrade?.assignment_marks || '')}
                                  onChange={(e) => handleGradeChange(enrollment.enrollment_id, 'assignment_marks', e.target.value)}
                                  style={styles.gradeInput}
                                  placeholder="0-20"
                                />
                              </td>
                              <td style={styles.td}>
                                <strong style={{color: '#16a085'}}>{finalIA}</strong>
                                <br />
                                <small style={{color: '#7f8c8d'}}>Auto-calc</small>
                              </td>
                              <td style={styles.td}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={gradeMarks[enrollment.enrollment_id]?.external_marks ?? (existingGrade?.external_marks ? existingGrade.external_marks * 2 : '')}
                                  onChange={(e) => handleGradeChange(enrollment.enrollment_id, 'external_marks', e.target.value)}
                                  style={styles.gradeInput}
                                  placeholder="0-100"
                                />
                              </td>
                              <td style={styles.td}>
                                <strong style={{fontSize: '16px', color: '#2c3e50'}}>{totalMarks}</strong>
                                <br />
                                <small style={{color: '#7f8c8d'}}>Auto-calc</small>
                              </td>
                              <td style={styles.td}>
                                {existingGrade && existingGrade.letter_grade ? (
                                  <div>
                                    <strong style={{fontSize: '18px', color: '#27ae60'}}>{existingGrade.letter_grade}</strong>
                                    <br />
                                    <small>{parseFloat(existingGrade.percentage || 0).toFixed(2)}%</small>
                                  </div>
                                ) : (
                                  <span style={{color: '#999'}}>Not graded</span>
                                )}
                              </td>
                              <td style={styles.td}>
                                {existingGrade ? (
                                  <button
                                    onClick={() => handleUpdateGrade(existingGrade.grade_id, enrollment.enrollment_id)}
                                    style={{...styles.addButton, backgroundColor: '#f39c12'}}
                                  >
                                    Update
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAddGrade(enrollment.enrollment_id)}
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

          {/* View Attendance Section */}
          {activeSection === 'updateAttendance' && (
            <div style={styles.section}>
              <h2>Update Attendance Records</h2>
              {selectedCourse ? (
                <>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '6px', borderLeft: '4px solid #1abc9c' }}>
                    <p style={styles.info}>
                      Course: <strong>{getCourseName(parseInt(selectedCourse))}</strong>
                    </p>
                    <p style={{fontSize: '14px', color: '#7f8c8d', marginTop: '10px'}}>
                      Tip: You can update the status and add notes for any attendance record
                    </p>
                  </div>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>Enrollment Number</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Notes</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance
                        .filter(record => record.course_id === parseInt(selectedCourse))
                        .sort((a, b) => new Date(b.attendance_date) - new Date(a.attendance_date))
                        .slice(0, 50)
                        .map((record) => {
                          const enrollment = enrollments.find(e => e.enrollment_id === record.enrollment_id);
                          const student = enrollment ? students.find(s => s.student_id === enrollment.student_id) : null;
                          const studentUser = student ? users.find(u => u.user_id === student.user_id) : null;
                          const studentName = studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : 'Unknown';
                          
                          return (
                            <tr key={record.attendance_id}>
                              <td style={styles.td}><strong>{studentName}</strong></td>
                              <td style={styles.td}>{student?.enrollment_number || 'N/A'}</td>
                              <td style={styles.td}>{new Date(record.attendance_date).toLocaleDateString()}</td>
                              <td style={styles.td}>
                                <select
                                  value={editingAttendance[record.attendance_id]?.status || record.status}
                                  onChange={(e) => handleAttendanceStatusChange(record.attendance_id, e.target.value)}
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
                                  value={attendanceNotes[record.attendance_id] ?? (record.notes || '')}
                                  onChange={(e) => handleAttendanceNotesChange(record.attendance_id, e.target.value)}
                                  placeholder="Add notes..."
                                  style={{...styles.gradeInput, width: '150px'}}
                                />
                              </td>
                              <td style={styles.td}>
                                <button
                                  onClick={() => handleUpdateAttendance(record.attendance_id)}
                                  style={{...styles.addButton, backgroundColor: '#f39c12'}}
                                >
                                  Update
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <p style={{ fontSize: '16px', color: '#777' }}>👆 Please select a course to view attendance</p>
                </div>
              )}
            </div>
          )}

          {/* View Students Section - NEW */}
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
                            a => a.enrollment_id === enrollment.enrollment_id
                          );
                          const totalClasses = studentAttendance.length;
                          const presentClasses = studentAttendance.filter(
                            a => a.status === 'present' || a.status === 'late'
                          ).length;
                          const attendancePercentage = totalClasses > 0 
                            ? ((presentClasses / totalClasses) * 100).toFixed(1)
                            : 0;
                          
                          // Find grade for this enrollment
                          const studentGrade = grades.find(g => g.enrollment_id === enrollment.enrollment_id);
                          
                          return (
                            <tr key={enrollment.enrollment_id}>
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
                          const enrollment = enrollments.find(e => e.enrollment_id === grade.enrollment_id);
                          const student = enrollment ? students.find(s => s.student_id === enrollment.student_id) : null;
                          const studentUser = student ? users.find(u => u.user_id === student.user_id) : null;
                          const studentName = studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : 'Unknown';
                          
                          return (
                            <tr key={grade.grade_id}>
                              <td style={styles.td}><strong>{studentName}</strong></td>
                              <td style={styles.td}>{student?.enrollment_number || 'N/A'}</td>
                              <td style={styles.td}>{grade.internal_marks}</td>
                              <td style={styles.td}>{grade.midterm_marks}</td>
                              <td style={styles.td}>{grade.final_marks}</td>
                              <td style={styles.td}><strong>{grade.total_marks}</strong></td>
                              <td style={styles.td}>{parseFloat(grade.percentage || 0).toFixed(2)}%</td>
                              <td style={styles.td}>
                                <span style={{
                                  ...styles.badge,
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  backgroundColor: 
                                    grade.letter_grade === 'A' ? '#27ae60' : 
                                    grade.letter_grade === 'B' ? '#2ecc71' :
                                    grade.letter_grade === 'C' ? '#f39c12' :
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
