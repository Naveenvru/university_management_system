import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminHome = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={styles.title}>Admin Dashboard</h1>
      <p style={styles.welcome}>Welcome, {user.first_name} {user.last_name}!</p>
      
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Students</h3>
          <p>Manage student records and information</p>
        </div>
        <div style={styles.card}>
          <h3>Faculty</h3>
          <p>Manage faculty members and assignments</p>
        </div>
        <div style={styles.card}>
          <h3>Courses</h3>
          <p>Manage courses and curriculum</p>
        </div>
        <div style={styles.card}>
          <h3>Enrollments</h3>
          <p>Manage student course enrollments</p>
        </div>
        <div style={styles.card}>
          <h3>Attendance</h3>
          <p>Track and manage attendance records</p>
        </div>
        <div style={styles.card}>
          <h3>Grades</h3>
          <p>Manage student grades and performance</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  title: {
    color: '#2c3e50',
    marginBottom: '10px',
  },
  welcome: {
    color: '#7f8c8d',
    marginBottom: '30px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '20px',
    backgroundColor: '#ecf0f1',
    borderRadius: '8px',
    border: '2px solid #bdc3c7',
  },
};

export default AdminHome;
