import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  User,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../common/ConfirmDialog';
import Avatar from '../common/Avatar';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Projects', path: '/projects', icon: <FolderKanban size={20} /> },
    { label: 'My Tasks', path: '/my-tasks', icon: <CheckSquare size={20} /> },
    { label: 'Profile', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <>
      <aside
        style={{
          width: '260px',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '28px 24px 24px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              color: 'var(--sidebar-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <Layers size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
              }}
            >
              ProjectFlow
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)' }}>
              Collaborative Workspace
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ flex: 1, padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#FFFFFF' : 'var(--sidebar-text-muted)',
                backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9375rem',
                transition: 'all 0.15s ease',
              })}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <Avatar user={user} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.fullName}
                </p>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--sidebar-text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              color: '#F87171',
              backgroundColor: 'transparent',
              fontSize: '0.9375rem',
              fontWeight: 500,
              width: '100%',
              textAlign: 'left',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

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
    </>
  );
};

export default Sidebar;
