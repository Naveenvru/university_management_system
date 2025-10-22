import React from 'react';

const Loading = () => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}>Loading...</div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  spinner: {
    fontSize: '18px',
    color: '#3498db',
  },
};

export default Loading;
