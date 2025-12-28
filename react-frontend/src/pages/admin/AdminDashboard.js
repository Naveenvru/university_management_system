import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const AdminDashboard = () => {
  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Admin Panel</h3>
          <nav style={styles.nav}>
            <Link to="/admin" style={styles.link}>Dashboard Home</Link>
            <Link to="/admin/departments" style={styles.link}>Manage Departments</Link>
            <Link to="/admin/courses" style={styles.link}>Manage Courses</Link>
            <Link to="/admin/enrollments" style={styles.link}>Manage Enrollments</Link>
          </nav>
        </aside>
        <main style={styles.main}>
          <Outlet />
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
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#34495e',
    padding: '20px',
    borderRadius: '8px',
    height: 'fit-content',
  },
  sidebarTitle: {
    color: 'white',
    marginBottom: '20px',
    fontSize: '20px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '10px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  main: {
    flex: 1,
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
};

export default AdminDashboard;
