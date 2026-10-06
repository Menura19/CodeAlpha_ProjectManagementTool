import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/common/Avatar';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters.');
      return;
    }
    if (fullName.trim().length > 60) {
      setError('Full name cannot exceed 60 characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateProfile(fullName.trim());
      showToast('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '2px' }}>
          Manage your personal account details and session.
        </p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        {/* User Identity Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}
        >
          <Avatar user={user} size="lg" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.fullName}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '2px' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--accent-coral-bg)',
                color: 'var(--accent-coral)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '16px',
                border: '1px solid var(--accent-coral-border)',
              }}
            >
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError('');
            }}
            error={error}
            required
            helperText="Your display name visible across team projects, tasks, and comments."
          />

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} color="var(--text-muted)" />
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="form-input"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'not-allowed',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Email address is your unique account identifier and cannot be modified.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button type="submit" variant="primary" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Account Session Card */}
      <div className="card" style={{ padding: '24px 32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Account Session</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          End your active session securely on this device.
        </p>

        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-coral-bg)',
            color: 'var(--accent-coral)',
            fontSize: '0.875rem',
            fontWeight: 600,
            border: '1px solid var(--accent-coral-border)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-coral-bg)')}
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Log Out"
        message="Are you sure you want to end your ProjectFlow session?"
        confirmText="Log Out"
        cancelText="Cancel"
        danger={false}
      />
    </div>
  );
};

export default ProfilePage;
