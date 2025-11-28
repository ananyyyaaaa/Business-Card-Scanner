import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // OTP functionality commented out - can be re-enabled later
  // const [otp, setOtp] = useState('');
  // const [step, setStep] = useState('credentials'); // 'credentials', 'otp'
  // import { login, sendOtp } from '../services/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      // Login without OTP - IP approval will be handled on backend
      const res = await login(email, password);
      if (res.token) {
        onLogin(res.token);
        // Show message if IP is not approved yet
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

  // OTP functions commented out for future use
  // const handleCredentialsSubmit = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   setMessage('');
  //   try {
  //     await sendOtp(email);
  //     setStep('otp');
  //     setMessage('OTP has been sent to your email. Please verify.');
  //   } catch (error) {
  //     console.error(error);
  //     setError(error.message || 'Invalid credentials or failed to send OTP');
  //   }
  // };

  // const handleOtpSubmit = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   setMessage('');
  //   try {
  //     const res = await login(email, password, otp);
  //     onLogin(res.token);
  //   } catch (error) {
  //     console.error(error);
  //     setError(error.message || 'Invalid OTP or credentials');
  //   }
  // };

  // const handleResendOtp = async () => {
  //   setError('');
  //   try {
  //     await sendOtp(email);
  //     setMessage('OTP has been resent to your email.');
  //   } catch (error) {
  //     setError(error.message || 'Failed to resend OTP.');
  //   }
  // };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-info">
          <div className="auth-badge">
            <FiShield />
            Enterprise Access
          </div>
          <h1>Welcome back</h1>
          <p className="muted">
            Securely manage exhibitions, scan cards and sync data instantly across the dashboard.
          </p>
          <ul className="auth-list">
            <li>
              <FiLock />
              IP whitelisting protects every login.
            </li>
            <li>
              <FiServer />
              Real-time dashboard updates after every scan.
            </li>
          </ul>
          <Link to="/admin/login" className="auth-link">Admin Login</Link>
        </div>

        <div className="auth-form">
          <h2>Sign in to continue</h2>
          <p className="muted">Use your registered email and password</p>
          {error && <div className="msg error">{error}</div>}
          {message && <div className="msg success">{message}</div>}
          <form onSubmit={handleSubmit} className="auth-form-fields">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="input auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="input auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button type="submit" className="primary auth-submit">
              Login
            </button>
          </form>
          <p className="auth-footnote">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
