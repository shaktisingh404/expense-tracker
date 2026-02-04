// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Grab tokens from the URL (These match the keys you set in Django views.py)
    const accessToken = searchParams.get('access');
    const refreshToken = searchParams.get('refresh');

    if (accessToken && refreshToken) {
      // 2. Save them
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // 3. Redirect to Dashboard
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return <div style={{ textAlign: 'center', marginTop: '50px' }}>Processing Login...</div>;
};

export default AuthCallback;