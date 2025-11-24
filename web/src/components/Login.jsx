import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login, sendOtp } from '../services/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('credentials'); // 'credentials', 'otp'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await sendOtp(email);
      setStep('otp');
      setMessage('OTP has been sent to your email. Please verify.');
    } catch (error) {
      console.error(error);
      setError(error.message || 'Invalid credentials or failed to send OTP');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await login(email, password, otp);
      onLogin(res.token);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Invalid OTP or credentials');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      await sendOtp(email);
      setMessage('OTP has been resent to your email.');
    } catch (error) {
      setError(error.message || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <div style={{ background: 'linear-gradient(180deg, rgba(96,165,250,0.1), rgba(244,114,182,0.1))', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '16px', padding: '32px' }}>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Login</h2>
        
        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit}>
            {error && <div className="msg error" style={{ marginBottom: '16px' }}>{error}</div>}
            <div className="table">
              <div className="row">
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="row">
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="primary">Continue</button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            {error && <div className="msg error" style={{ marginBottom: '16px' }}>{error}</div>}
            {message && <div className="msg success" style={{ marginBottom: '16px' }}>{message}</div>}
            <div className="table">
              <div className="row">
                <label className="label">OTP</label>
                <input
                  type="text"
                  className="input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP sent to your email"
                  required
                  maxLength="6"
                />
              </div>
            </div>
            <button type="submit" className="primary">Verify & Login</button>
            <button type="button" className="btn" onClick={handleResendOtp} style={{ marginTop: '12px', width: '100%' }}>
              Resend OTP
            </button>
            <button type="button" className="btn" onClick={() => setStep('credentials')} style={{ marginTop: '8px', width: '100%' }}>
              Back
            </button>
          </form>
        )}
        
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#60a5fa' }}>Sign Up</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '12px', color: 'var(--muted)' }}>
          <Link to="/admin/login" style={{ color: '#60a5fa' }}>Admin Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
