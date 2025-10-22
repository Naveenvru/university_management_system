import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (user.role === 'admin') return '/admin';
    if (user.role === 'faculty') return '/faculty';
    if (user.role === 'student') return '/student';
    return '/';
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <Link to={getDashboardLink()} style={styles.brand}>
          University Management System
        </Link>
        <div style={styles.navItems}>
          <span style={styles.userInfo}>
            {user.first_name} {user.last_name} ({user.role})
          </span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '15px 0',
    marginBottom: '20px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    textDecoration: 'none',
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  userInfo: {
    fontSize: '14px',
  },
  logoutBtn: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default Navbar;
