import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signup } from '../services/api';

const Signup = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // OTP functionality commented out - can be re-enabled later
  // import { signup, sendOtp, verifyOtp } from '../services/api';
  // const [otp, setOtp] = useState('');
  // const [step, setStep] = useState('signup'); // 'signup', 'otp'

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      // Signup without OTP - IP approval will be handled on backend
      const res = await signup(name, email, password);
      if (res.token) {
        // User created, token received - IP request sent to admin
        onSignup(res.token);
        if (res.message) {
          setMessage(res.message);
        }
      }
    } catch (error) {
      console.error(error);
      setError(error.message || 'Could not create account. Please try again.');
    }
  };

  // OTP functions commented out for future use
  // const handleVerifyOtp = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   setMessage('');
  //   try {
  //     const res = await verifyOtp(email, otp);
  //     if (res.success) {
  //       onSignup(res.token);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     setError(error.message || 'Invalid OTP. Please try again.');
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
    <div className="container" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <div style={{ background: 'linear-gradient(180deg, rgba(96,165,250,0.1), rgba(244,114,182,0.1))', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '16px', padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.jpg" alt="Logo" style={{ maxHeight: '60px' }} />
        </div>
        <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>Sign Up</h2>

        <form onSubmit={handleSignup}>
          {error && <div className="msg error" style={{ marginBottom: '16px' }}>{error}</div>}
          {message && <div className="msg success" style={{ marginBottom: '16px' }}>{message}</div>}
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

        {/* OTP form commented out - can be re-enabled later */}
        {/* {step === 'otp' && (
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
        )} */}

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--muted)' }}>
          Already have an account? <Link to="/login" style={{ color: '#60a5fa' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
