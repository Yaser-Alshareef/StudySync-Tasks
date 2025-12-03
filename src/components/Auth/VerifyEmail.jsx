import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resendVerificationEmail, checkEmailVerification, logoutUser } from '../../api/authService';
import LoadingSpinner from '../Common/LoadingSpinner';
import './Auth.css';

const VerifyEmail = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.emailVerified) {
      navigate('/dashboard');
    }
  }, [currentUser, authLoading, navigate]);

  const checkVerification = async () => {
    setChecking(true);
    const result = await checkEmailVerification();
    setChecking(false);

    if (result.success && result.verified) {
      navigate('/dashboard');
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    const result = await resendVerificationEmail();

    if (result.success) {
      setMessage('Verification email sent! Please check your inbox.');
    } else {
      setError(result.error || 'Failed to send verification email.');
    }

    setLoading(false);
  };

  const handleSignIn = async () => {
    await logoutUser();
    navigate('/login');
  };

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <p>We sent a verification link to</p>
          <p style={{ fontWeight: 600, marginTop: '0.5rem', wordBreak: 'break-word' }}>{currentUser.email}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Please check your email and click the verification link to activate your account.
          </p>

          <button
            onClick={checkVerification}
            className="btn btn-primary btn-block"
            disabled={checking}
            style={{ marginBottom: '1rem' }}
          >
            {checking ? 'Checking...' : 'I\'ve Verified My Email'}
          </button>

          <button
            onClick={handleResend}
            className="btn btn-outline btn-block"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Want to use a different account?{' '}
            <button
              onClick={handleSignIn}
              className="auth-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;

