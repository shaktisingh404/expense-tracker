// src/pages/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Clear Tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // 2. Redirect to Login
    navigate('/login');
  }, [navigate]);

  return <div style={{ textAlign: 'center', marginTop: '50px' }}>Logging out...</div>;
};

export default Logout;