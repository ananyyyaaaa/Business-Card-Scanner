import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiLock, FiServer, FiTrendingUp, FiPackage, FiBarChart2 } from 'react-icons/fi';
import { login } from '../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await login(email, password);
      if (res.token) {
        onLogin(res.token, res.role, email);
        if (res.message) {
          setMessage(res.message);
        }
      } else if (res.message) {
        setMessage(res.message);
      }
    } catch (error) {
      console.error(error);
      setError(error.message || 'Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <h1>OMSONS GERMANY</h1>
          <div className="login-badge">G.A.P. System</div>
          <h2>Enterprise Resource Planning</h2>
          <p className="login-tagline">Powering Modern Manufacturing Excellence</p>
        </div>
        
        <div className="login-features">
          <div className="feature-card">
            <div className="feature-icon">
              <FiTrendingUp />
            </div>
            <div className="feature-content">
              <h3>Production Planning</h3>
              <p>Optimize your manufacturing workflow with intelligent scheduling</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FiPackage />
            </div>
            <div className="feature-content">
              <h3>Smart Inventory</h3>
              <p>Real-time tracking and management of your resources</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">
              <FiBarChart2 />
            </div>
            <div className="feature-content">
              <h3>Business Intelligence</h3>
              <p>Data-driven insights for better decision making</p>
            </div>
          </div>
        </div>
        
        <div className="login-trust">
          <p>Trusted by manufacturing leaders since 2025</p>
        </div>
      </div>
      
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to access your ERP system</p>
            
            {error && <div className="msg error">{error}</div>}
            {message && <div className="msg success">{message}</div>}
            
            <form onSubmit={handleSubmit} className="login-form-fields">
              <div className="form-group">
                <label>USERNAME</label>
                <input
                  type="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>PASSWORD</label>
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <button type="submit" className="login-button">
                Sign In
              </button>
            </form>
            
            <div className="login-help">
              <p>Need Help?</p>
              <button type="button" className="contact-button">
                Contact Administrator
              </button>
            </div>
            
            <div className="login-copyright">
              <p>© 2025 OMSONS GERMANY. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
