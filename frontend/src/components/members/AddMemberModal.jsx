import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const AddMemberModal = ({ isOpen, onClose, projectId, onSuccess }) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a registered user email address.');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email: email.trim() });
      showToast(res.data.message || 'Member added successfully.');
      if (onSuccess) onSuccess(res.data.member);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add member. Check the email and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member"
      maxWidth="460px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Add Member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Fixed role information */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Role assigned
          </span>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #E2E8F0',
            }}
          >
            Member
          </span>
        </div>

        <Input
          label="User Email Address"
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          error={error}
          required
          helperText="Enter the exact registered email of the team member."
        />
      </form>
    </Modal>
  );
};

export default AddMemberModal;
