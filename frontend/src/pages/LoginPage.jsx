import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Layers } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    const emailRe = /^\S+@\S+\.\S+$/;
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!emailRe.test(email.trim())) errs.email = 'Please enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}>
        {/* Dark header */}
        <div style={{ backgroundColor: 'var(--sidebar-bg)', padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="var(--sidebar-bg)" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              ProjectFlow
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9375rem', marginTop: '12px' }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px' }}>
          {apiError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--accent-coral-bg)', color: 'var(--accent-coral)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '20px', border: '1px solid var(--accent-coral-border)' }}>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              autoComplete="current-password"
            />

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '-4px 0 20px 0' }}>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                Remember me
              </label>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%' }}>
              Sign In
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
