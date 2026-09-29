import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, User, Flag, Clock, MessageSquare, Send, Trash2, Edit2 } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const TaskDetailModal = ({ taskId, projectOwnerId, isOpen, onClose, onTaskUpdated, onTaskDeleted }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskRes, commentsRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
      ]);
      setTask(taskRes.data.task);
      setComments(commentsRes.data.comments || []);
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen && taskId) fetchTask();
    if (!isOpen) {
      setTask(null);
      setComments([]);
      setCommentText('');
      setCommentError('');
    }
  }, [isOpen, taskId, fetchTask]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) { setCommentError('Comment cannot be empty.'); return; }
    if (commentText.trim().length > 2000) { setCommentError('Comment too long.'); return; }
    setPosting(true);
    setCommentError('');
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { content: commentText.trim() });
      setComments((prev) => [...prev, res.data.comment]);
      setCommentText('');
      setTask((prev) => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
    } catch (err) {
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setTask((prev) => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : prev);
      showToast('Comment deleted.');
    } catch (err) {
      showToast(err.message || 'Failed to delete comment.', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task and all its comments?')) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${taskId}`);
      showToast('Task deleted successfully.');
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to delete task.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const isProjectOwner = projectOwnerId && user?._id === projectOwnerId;
  const isTaskCreator = task?.createdBy?._id === user?._id;
  const canDelete = isProjectOwner || isTaskCreator;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Task Details"
    >
      <div
        className="modal-container"
        style={{ maxWidth: '720px', maxHeight: '90vh', flexDirection: 'row' }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--border-medium)', borderTopColor: 'var(--primary)' }} />
          </div>
        ) : task ? (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {/* Header */}
            <div className="modal-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="modal-title" style={{ fontSize: '1.125rem', lineHeight: 1.3 }}>{task.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <Badge type="status" value={task.status} />
                  <Badge type="priority" value={task.priority} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {canDelete && (
                  <Button variant="ghost" size="sm" icon={<Trash2 size={15} />} loading={deleting} onClick={handleDeleteTask} style={{ color: 'var(--accent-coral)' }}>
                    Delete
                  </Button>
                )}
                <button className="modal-close-btn" onClick={onClose} aria-label="Close task details"><X size={20} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: Details + Comments */}
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Description */}
                {task.description ? (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Description</p>
                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{task.description}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No description provided.</p>
                )}

                {/* Comments */}
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Comments ({comments.length})
                  </p>

                  {comments.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '16px' }}>No comments yet. Be the first to comment.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                      {comments.map((c) => {
                        const canDeleteComment = user?._id === c.author?._id || isProjectOwner;
                        return (
                          <div key={c._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <Avatar user={c.author} size="sm" />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{c.author?.fullName}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDateTime(c.createdAt)}</span>
                                </div>
                                {canDeleteComment && (
                                  <button
                                    onClick={() => handleDeleteComment(c._id)}
                                    style={{ color: 'var(--text-muted)', display: 'flex', padding: '2px' }}
                                    title="Delete comment"
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>
                              <div style={{
                                padding: '10px 14px',
                                backgroundColor: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                lineHeight: 1.55,
                                color: 'var(--text-main)',
                              }}>
                                {c.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Avatar user={user} size="sm" />
                    <div style={{ flex: 1 }}>
                      <form onSubmit={handlePostComment}>
                        <textarea
                          placeholder="Write a comment…"
                          value={commentText}
                          onChange={(e) => { setCommentText(e.target.value); setCommentError(''); }}
                          rows={2}
                          className={`form-textarea ${commentError ? 'has-error' : ''}`}
                          style={{ resize: 'none', marginBottom: '6px' }}
                        />
                        {commentError && <p className="form-error">{commentError}</p>}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button type="submit" variant="primary" size="sm" loading={posting} icon={<Send size={14} />}>
                            Post Comment
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Metadata sidebar */}
              <div style={{
                width: '220px',
                borderLeft: '1px solid var(--border-subtle)',
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                backgroundColor: 'var(--bg-app)',
                overflowY: 'auto',
                flexShrink: 0,
              }}>
                {[
                  {
                    icon: <User size={14} />, label: 'Assignee',
                    value: task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar user={task.assignee} size="sm" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{task.assignee.fullName}</span>
                      </div>
                    ) : <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Unassigned</span>
                  },
                  {
                    icon: <Flag size={14} />, label: 'Priority',
                    value: <Badge type="priority" value={task.priority} />
                  },
                  {
                    icon: <Clock size={14} />, label: 'Due Date',
                    value: (
                      <span style={{
                        fontSize: '0.875rem',
                        color: (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') ? 'var(--accent-coral)' : 'var(--text-main)',
                        fontWeight: 500,
                      }}>
                        {formatDate(task.dueDate)}
                      </span>
                    )
                  },
                  {
                    icon: <User size={14} />, label: 'Created by',
                    value: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar user={task.createdBy} size="sm" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{task.createdBy?.fullName}</span>
                      </div>
                    )
                  },
                  {
                    icon: <Calendar size={14} />, label: 'Created',
                    value: <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{formatDate(task.createdAt)}</span>
                  },
                  {
                    icon: <MessageSquare size={14} />, label: 'Comments',
                    value: <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{task.commentCount || comments.length}</span>
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {item.icon}
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {item.label}
                      </span>
                    </div>
                    {item.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Task not found or access denied.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
