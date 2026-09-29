import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, LayoutKanban, Edit2, Trash2, ChevronRight } from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const ProjectCard = ({ project, currentUserId, onEdit, onDelete, onViewMembers }) => {
  const navigate = useNavigate();

  const isOwner = project.owner?._id === currentUserId;
  const progress = project.progress ?? 0;
  const totalTasks = project.taskCount ?? 0;
  const memberCount = (project.members?.length ?? 0) + 1; // +1 for owner
  const displayMembers = [project.owner, ...(project.members ?? [])].filter(Boolean).slice(0, 5);
  const remaining = memberCount > 5 ? memberCount - 5 : 0;
  const dueDateStr = formatDate(project.dueDate);
  const overdue = isOverdue(project.dueDate) && progress < 100;

  return (
    <div
      className="card"
      style={{
        padding: '20px 22px 16px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onClick={() => navigate(`/projects/${project._id}/board`)}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              lineHeight: 1.3,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {project.name}
          </h3>
          {isOwner ? (
            <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600 }}>You own this</span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              by {project.owner?.fullName || 'Unknown'}
            </span>
          )}
        </div>

        {/* Owner-only Actions */}
        {isOwner && (
          <div
            style={{ display: 'flex', gap: '4px', flexShrink: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              title="Edit Project"
              onClick={() => onEdit?.(project)}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Edit2 size={15} />
            </button>
            <button
              title="Delete Project"
              onClick={() => onDelete?.(project)}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-coral-bg)'; e.currentTarget.style.color = 'var(--accent-coral)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: '-6px 0 0 0',
          }}
        >
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {totalTasks === 0 ? 'No tasks yet' : `${project.completedTaskCount ?? 0} / ${totalTasks} completed`}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: progress === 100 ? 'var(--accent-green)' : 'var(--text-secondary)',
            }}
          >
            {progress}%
          </span>
        </div>
        <div
          style={{
            height: '5px',
            backgroundColor: 'var(--bg-hover)',
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: progress === 100 ? 'var(--accent-green)' : 'var(--accent-blue)',
              borderRadius: 'var(--radius-pill)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Footer Meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Members & Due Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Member Avatars */}
          <div
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onViewMembers?.(project); }}
            title="View Members"
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {displayMembers.map((m, i) => (
                <div
                  key={m?._id ?? i}
                  style={{
                    marginLeft: i === 0 ? 0 : '-8px',
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF',
                  }}
                >
                  <Avatar user={m} size="sm" />
                </div>
              ))}
            </div>
            {remaining > 0 && (
              <div
                style={{
                  marginLeft: '-8px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-hover)',
                  border: '2px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                +{remaining}
              </div>
            )}
            <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {memberCount}
            </span>
          </div>

          {dueDateStr && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: overdue ? 'var(--accent-coral)' : 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              <Calendar size={13} />
              {dueDateStr}
              {overdue && <span style={{ fontWeight: 600 }}>· Overdue</span>}
            </div>
          )}
        </div>

        {/* Open Board Button */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}/board`); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid var(--border-subtle)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#18191E'; e.currentTarget.style.color = '#FFFFFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <LayoutKanban size={13} />
          Board
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
