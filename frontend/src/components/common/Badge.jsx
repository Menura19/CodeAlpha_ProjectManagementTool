import React from 'react';

const STATUS_CONFIG = {
  todo: { label: 'To Do', className: 'badge-todo' },
  in_progress: { label: 'In Progress', className: 'badge-in_progress' },
  review: { label: 'Review', className: 'badge-review' },
  completed: { label: 'Completed', className: 'badge-completed' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', className: 'badge-low' },
  medium: { label: 'Medium', className: 'badge-medium' },
  high: { label: 'High', className: 'badge-high' },
};

const ROLE_CONFIG = {
  Owner: { label: 'Owner', className: 'badge-owner' },
  Member: { label: 'Member', className: 'badge-member' },
};

const Badge = ({ type = 'status', value, className = '' }) => {
  if (!value) return null;

  let config = null;
  if (type === 'status') {
    config = STATUS_CONFIG[value] || { label: value, className: 'badge-todo' };
  } else if (type === 'priority') {
    config = PRIORITY_CONFIG[value] || { label: value, className: 'badge-medium' };
  } else if (type === 'role') {
    config = ROLE_CONFIG[value] || { label: value, className: 'badge-member' };
  }

  return (
    <span className={`badge ${config?.className || ''} ${className}`.trim()}>
      {config?.label || value}
    </span>
  );
};

export default Badge;
