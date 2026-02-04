// src/pages/Login.tsx
import React, { useState } from 'react';
import { loginUser } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // Import the CSS

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginUser({ username, password });
      
      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;

      if (!accessToken) throw new Error("Token missing");

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    }
  };

  const handleOktaLogin = () => {
    // Redirect browser directly to Django's Okta endpoint
    // Django will handle the OAuth dance and likely redirect back with a token
    window.location.href = 'http://localhost:8000/api/users/login/okta/';
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Welcome Back</h2>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginBottom: '10px' }}>
            Log In
          </button>
        </form>

        <div style={{ textAlign: 'center', margin: '15px 0', color: '#aaa' }}>OR</div>

        {/* OKTA BUTTON */}
        <button 
          type="button" 
          onClick={handleOktaLogin} 
          className="btn-outline"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
        >
          {/* Simple Circle Icon for visual */}
          <span style={{ height: '12px', width: '12px', borderRadius: '50%', background: '#00297A' }}></span>
          Login with Okta
        </button>
      </div>
    </div>
  );
};

export default Login;