import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signup, sendOtp, verifyOtp } from '../services/api';

const Signup = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('signup'); // 'signup', 'otp'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await signup(name, email, password);
      await sendOtp(email);
      setStep('otp');
      setMessage('OTP has been sent to your email. Please verify.');
    } catch (error) {
      console.error(error);
      setError(error.message || 'Could not create account. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        onSignup(res.token);
      }
    } catch (error) {
      console.error(error);
      setError(error.message || 'Invalid OTP. Please try again.');
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
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Sign Up</h2>
        
        {step === 'signup' ? (
          <form onSubmit={handleSignup}>
            {error && <div className="msg error" style={{ marginBottom: '16px' }}>{error}</div>}
            <div className="table">
              <div className="row">
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
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
            <button type="submit" className="primary">Sign Up</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
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
            <button type="submit" className="primary">Verify OTP</button>
            <button type="button" className="btn" onClick={handleResendOtp} style={{ marginTop: '12px', width: '100%' }}>
              Resend OTP
            </button>
            <button type="button" className="btn" onClick={() => setStep('signup')} style={{ marginTop: '8px', width: '100%' }}>
              Back
            </button>
          </form>
        )}
        
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--muted)' }}>
          Already have an account? <Link to="/login" style={{ color: '#60a5fa' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
