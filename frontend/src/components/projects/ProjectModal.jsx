import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const ProjectModal = ({ isOpen, onClose, project = null, onSuccess }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
    } else {
      setName('');
      setDescription('');
      setDueDate('');
    }
    setErrors({});
  }, [project, isOpen]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Project name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Project name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      errs.name = 'Project name cannot exceed 100 characters';
    }
    if (description && description.length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
      };

      if (project) {
        const res = await api.patch(`/projects/${project._id}`, payload);
        showToast('Project updated successfully.');
        if (onSuccess) onSuccess(res.data.project);
      } else {
        const res = await api.post('/projects', payload);
        showToast('Project created successfully.');
        if (onSuccess) onSuccess(res.data.project);
      }
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save project.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : 'Create New Project'}
      maxWidth="520px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {errors.form && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--accent-coral-bg)',
              color: 'var(--accent-coral)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            {errors.form}
          </div>
        )}

        <Input
          label="Project Name"
          placeholder="e.g. Website Redesign Project"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <div className="form-group">
          <label htmlFor="project-desc" className="form-label">
            Description
          </label>
          <textarea
            id="project-desc"
            placeholder="Brief overview of project goals, deliverables, and scope…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`form-textarea ${errors.description ? 'has-error' : ''}`}
            style={{ resize: 'vertical' }}
          />
          {errors.description && <p className="form-error">{errors.description}</p>}
        </div>

        <Input
          label="Target Due Date (Optional)"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          helperText="Optional project milestone or completion deadline."
        />
      </form>
    </Modal>
  );
};

export default ProjectModal;
