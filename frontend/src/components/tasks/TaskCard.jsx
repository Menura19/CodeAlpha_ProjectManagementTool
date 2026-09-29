import React from 'react';
import { Calendar, MessageSquare, AlertCircle, Edit2, Trash2, Eye } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (d) => d && new Date(d) < new Date();

const TaskCard = ({ task, currentUserId, isOwner, onEdit, onDelete, onViewDetails, dragging = false }) => {
  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
  const isTaskCreator = task.createdBy?._id === currentUserId;
  const canDelete = isOwner || isTaskCreator;

  return (
    <div
      style={{
        padding: '14px 16px',
        backgroundColor: dragging ? '#F0EDFF' : '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${dragging ? '#A5B4FC' : 'var(--border-subtle)'}`,
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'var(--shadow-sm)',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        opacity: dragging ? 0.9 : 1,
      }}
    >
      {/* Top Row: Priority + Actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
        <Badge type="priority" value={task.priority} />

        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(task._id); }}
            title="View task details"
            style={{ padding: '4px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Eye size={13} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}
            title="Edit task"
            style={{ padding: '4px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Edit2 size={13} />
          </button>
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(task); }}
              title="Delete task"
              style={{ padding: '4px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', display: 'flex' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-coral-bg)'; e.currentTarget.style.color = 'var(--accent-coral)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <p
        style={{
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          lineHeight: 1.4,
          cursor: 'pointer',
        }}
        onClick={() => onViewDetails?.(task._id)}
      >
        {task.title}
      </p>

      {/* Footer: Assignee + Due Date + Comment Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.assignee ? (
            <Avatar user={task.assignee} size="sm" />
          ) : (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-hover)',
                border: '1px dashed var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Unassigned"
            >
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>?</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {task.dueDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.75rem',
                color: overdue ? 'var(--accent-coral)' : 'var(--text-muted)',
                fontWeight: overdue ? 700 : 500,
              }}
            >
              {overdue && <AlertCircle size={12} />}
              <Calendar size={12} />
              {formatDate(task.dueDate)}
            </div>
          )}
          {task.commentCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={12} />
              {task.commentCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
