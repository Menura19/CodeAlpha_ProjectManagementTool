import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const TaskModal = ({ isOpen, onClose, projectId, task = null, participants = [], onSuccess }) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setAssignee(task.assignee?._id || task.assignee || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssignee('');
      setDueDate('');
    }
    setErrors({});
  }, [task, isOpen]);

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Task title is required.';
    else if (title.trim().length > 200) errs.title = 'Title cannot exceed 200 characters.';
    if (!['todo', 'in_progress', 'review', 'completed'].includes(status)) errs.status = 'Invalid status selected.';
    if (!['low', 'medium', 'high'].includes(priority)) errs.priority = 'Invalid priority selected.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee || null,
      dueDate: dueDate || null,
    };

    try {
      let res;
      if (task) {
        res = await api.patch(`/tasks/${task._id}`, payload);
        showToast('Task updated successfully.');
      } else {
        res = await api.post(`/projects/${projectId}/tasks`, payload);
        showToast('Task created successfully.');
      }
      if (onSuccess) onSuccess(res.data.task);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save task.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Create New Task'}
      maxWidth="580px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errors.form && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--accent-coral-bg)', color: 'var(--accent-coral)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '16px' }}>
            {errors.form}
          </div>
        )}

        <Input
          label="Task Title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            placeholder="Provide additional details, acceptance criteria, or context…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="form-textarea"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status <span style={{ color: 'var(--accent-coral)' }}>*</span></label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`form-select ${errors.status ? 'has-error' : ''}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.status && <p className="form-error">{errors.status}</p>}
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority <span style={{ color: 'var(--accent-coral)' }}>*</span></label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`form-select ${errors.priority ? 'has-error' : ''}`}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.priority && <p className="form-error">{errors.priority}</p>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Assignee — only project participants */}
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="form-select"
            >
              <option value="">Unassigned</option>
              {participants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} {p.isOwner ? '(Owner)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <Input
            label="Due Date (Optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default TaskModal;
