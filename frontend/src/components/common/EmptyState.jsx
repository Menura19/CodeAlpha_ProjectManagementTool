import React from 'react';
import Button from './Button';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({
  icon = <FolderOpen size={48} color="var(--text-muted)" />,
  title = 'No records found',
  message = 'Get started by creating your first entry.',
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 24px',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-medium)',
        width: '100%',
      }}
    >
      <div style={{ marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '420px', marginBottom: actionText ? '20px' : 0 }}>
        {message}
      </p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction} icon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
