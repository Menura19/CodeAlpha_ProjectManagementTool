import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, FolderKanban } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectModal from '../components/projects/ProjectModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { CardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';

const ProjectsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'owned', 'joined'
  const [search, setSearch] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filter !== 'all') params.filter = filter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/projects', { params });
      setProjects(res.data.projects || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/projects/${deletingProject._id}`);
      showToast('Project and all associated tasks and comments have been deleted.');
      setProjects((prev) => prev.filter((p) => p._id !== deletingProject._id));
      setDeletingProject(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete project.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '2px' }}>
            Manage and track all group projects you own or collaborate on.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => {
            setEditingProject(null);
            setModalOpen(true);
          }}
        >
          Create Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Tabs: All / Owned / Joined */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'owned', label: 'Owned by Me' },
            { id: 'joined', label: 'Joined' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                fontWeight: filter === tab.id ? 700 : 500,
                backgroundColor: filter === tab.id ? '#FFFFFF' : 'transparent',
                color: filter === tab.id ? 'var(--text-main)' : 'var(--text-secondary)',
                boxShadow: filter === tab.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 14px',
            width: '280px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search projects…"
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

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--accent-coral-bg)',
            color: 'var(--accent-coral)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid var(--accent-coral-border)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <Button variant="danger" size="sm" onClick={fetchProjects}>
            Retry
          </Button>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={48} color="var(--text-muted)" />}
          title={search ? 'No projects match your search' : 'No projects found'}
          message={
            search
              ? `We couldn't find any projects matching "${search}". Try a different keyword or clear filters.`
              : filter === 'owned'
              ? 'You have not created any projects yet. Start by creating a project.'
              : filter === 'joined'
              ? 'You have not joined any group projects yet. When an owner adds your email, projects will show here.'
              : 'Create your first project to organize tasks, assign teammates, and track milestones.'
          }
          actionText={search ? 'Clear Search' : 'Create Project'}
          onAction={() => {
            if (search) {
              setSearch('');
            } else {
              setEditingProject(null);
              setModalOpen(true);
            }
          }}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              currentUserId={user?._id}
              onEdit={(p) => {
                setEditingProject(p);
                setModalOpen(true);
              }}
              onDelete={(p) => setDeletingProject(p)}
              onViewMembers={(p) => navigate(`/projects/${p._id}/members`)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSuccess={() => fetchProjects()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Project"
        message={
          deletingProject
            ? `Are you sure you want to permanently delete "${deletingProject.name}"? This action cannot be undone. All associated tasks, assignments, and comments will also be permanently deleted from MongoDB.`
            : ''
        }
        confirmText="Delete Project"
        cancelText="Cancel"
        danger={true}
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProjectsPage;
