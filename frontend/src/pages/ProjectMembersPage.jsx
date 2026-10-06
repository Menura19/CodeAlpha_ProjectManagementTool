import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, UserPlus, ArrowLeft, Search, X, Trash2, Shield, User } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import AddMemberModal from '../components/members/AddMemberModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

const ProjectMembersPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Add & Remove member modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchProjectAndMembers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projRes, memRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/members`),
      ]);
      setProject(projRes.data.project);
      setMembers(memRes.data.members || []);
    } catch (err) {
      if (err.status === 403) {
        setError('You do not have permission to view members of this project.');
      } else if (err.status === 404) {
        setError('Project not found.');
      } else {
        setError(err.message || 'Failed to load project members.');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectAndMembers();
  }, [fetchProjectAndMembers]);

  const isOwner = project && project.owner && (project.owner._id === user?._id || project.owner === user?._id);

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  const handleRemoveMemberConfirm = async () => {
    if (!removingMember) return;
    setRemoveLoading(true);
    try {
      await api.delete(`/projects/${projectId}/members/${removingMember._id}`);
      showToast(`${removingMember.fullName} removed and their assigned tasks were unassigned.`);
      setMembers((prev) => prev.filter((m) => m._id !== removingMember._id));
      setRemovingMember(null);
    } catch (err) {
      showToast(err.message || 'Failed to remove member.', 'error');
    } finally {
      setRemoveLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--accent-coral-bg)',
            color: 'var(--accent-coral)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent-coral-border)',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Access Error</h2>
          <p>{error}</p>
        </div>
        <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Back button and title */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/projects/${projectId}/board`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          <ArrowLeft size={16} /> Back to Board
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {loading ? <Skeleton width="200px" height="32px" /> : `${project?.name} · Team`}
              </h1>
              {!loading && (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {members.length} {members.length === 1 ? 'Participant' : 'Participants'}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '4px' }}>
              Only project participants can be assigned tasks or post comments.
            </p>
          </div>

          {isOwner && (
            <Button
              variant="primary"
              icon={<UserPlus size={18} />}
              onClick={() => setAddModalOpen(true)}
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Search Toolbar */}
      <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search members by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
              width: '100%',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ display: 'flex', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Member List Table / Cards */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Skeleton width="40px" height="40px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="180px" height="16px" style={{ marginBottom: '6px' }} />
                  <Skeleton width="120px" height="12px" />
                </div>
                <Skeleton width="70px" height="24px" borderRadius="9999px" />
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              No team members match "{search}".
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredMembers.map((member, index) => {
              const isMemberOwner = member.isOwner || member.role === 'Owner';
              const canRemove = isOwner && !isMemberOwner;

              return (
                <div
                  key={member._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: index < filteredMembers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {/* User info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <Avatar user={member} size="md" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {member.fullName}
                        </span>
                        {member._id === user?._id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            (You)
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge and Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Badge type="role" value={isMemberOwner ? 'Owner' : 'Member'} />

                    {canRemove && (
                      <button
                        title="Remove member from project"
                        onClick={() => setRemovingMember(member)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--accent-coral)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-coral-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        projectId={projectId}
        onSuccess={() => fetchProjectAndMembers()}
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!removingMember}
        onClose={() => setRemovingMember(null)}
        onConfirm={handleRemoveMemberConfirm}
        title="Remove Team Member"
        message={
          removingMember
            ? `Are you sure you want to remove ${removingMember.fullName} (${removingMember.email}) from this project? Any tasks currently assigned to them in this project will automatically become Unassigned.`
            : ''
        }
        confirmText="Remove Member"
        cancelText="Cancel"
        danger={true}
        loading={removeLoading}
      />
    </div>
  );
};

export default ProjectMembersPage;
