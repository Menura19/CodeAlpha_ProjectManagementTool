import React from 'react';

const COLORS = [
  '#2563EB', '#D97706', '#059669', '#7C3AED', '#DB2777', '#0891B2', '#EA580C', '#4F46E5',
];

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColor = (str) => {
  if (!str) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const Avatar = ({ user, name, size = 'md', className = '' }) => {
  const displayName = name || user?.fullName || 'User';
  const initials = getInitials(displayName);
  const bgColor = getColor(displayName);

  const sizeMap = {
    sm: { width: '28px', height: '28px', fontSize: '0.75rem' },
    md: { width: '36px', height: '36px', fontSize: '0.875rem' },
    lg: { width: '48px', height: '48px', fontSize: '1.125rem' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      title={displayName}
      className={className}
      style={{
        ...currentSize,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        userSelect: 'none',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
