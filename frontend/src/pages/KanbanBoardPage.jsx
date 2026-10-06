import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Plus, ArrowLeft, Calendar } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskModal from '../components/tasks/TaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import Badge from '../components/common/Badge';

const KanbanBoardPage = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if taskId was provided in URL query string (e.g. from global search)
  useEffect(() => {
    const qTaskId = searchParams.get('taskId');
    if (qTaskId) {
      setActiveTaskId(qTaskId);
    }
  }, [searchParams]);

  const fetchProjectData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projRes, tasksRes, memRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/members`),
      ]);

      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks || []);
      setParticipants(memRes.data.members || []);
    } catch (err) {
      if (err.status === 403) {
        setError('You do not have access to view this project board.');
      } else if (err.status === 404) {
        setError('Project not found.');
      } else {
        setError(err.message || 'Failed to load project board.');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const isOwner = project && project.owner && (project.owner._id === user?._id || project.owner === user?._id);

  const handleOpenAddTask = (status = 'todo') => {
    setEditingTask(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!deletingTask) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/tasks/${deletingTask._id}`);
      showToast('Task deleted successfully.');
      setTasks((prev) => prev.filter((t) => t._id !== deletingTask._id));
      setDeletingTask(null);
      if (activeTaskId === deletingTask._id) {
        setActiveTaskId(null);
        searchParams.delete('taskId');
        setSearchParams(searchParams);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete task.', 'error');
    } finally {
      setDeleteLoading(false);
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>Project Error</h2>
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
      {/* Top bar with back link, project title, progress, and team link */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/projects')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '10px',
          }}
        >
          <ArrowLeft size={16} /> All Projects
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {loading ? <Skeleton width="220px" height="32px" /> : project?.name}
              </h1>
              {!loading && isOwner && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', backgroundColor: '#F5F3FF', padding: '2px 8px', borderRadius: 'var(--radius-pill)', border: '1px solid #DDD6FE' }}>
                  Owner
                </span>
              )}
            </div>
            {project?.description && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '4px', maxWidth: '720px' }}>
                {project.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate(`/projects/${projectId}/members`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
            >
              <Users size={16} />
              Team Members ({participants.length})
            </button>

            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => handleOpenAddTask('todo')}
            >
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board Component */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ backgroundColor: 'var(--bg-subtle)', padding: '16px', borderRadius: 'var(--radius-lg)', minHeight: '320px' }}>
              <Skeleton width="100px" height="20px" style={{ marginBottom: '16px' }} />
              <Skeleton width="100%" height="80px" style={{ marginBottom: '10px' }} />
              <Skeleton width="100%" height="80px" />
            </div>
          ))}
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          participants={participants}
          currentUserId={user?._id}
          isOwner={isOwner}
          onTasksRefetch={(updater) => {
            if (typeof updater === 'function') {
              setTasks(updater);
            } else {
              fetchProjectData();
            }
          }}
          onAddTask={handleOpenAddTask}
          onEditTask={handleOpenEditTask}
          onDeleteTask={(t) => setDeletingTask(t)}
          onViewDetails={(tId) => {
            setActiveTaskId(tId);
            setSearchParams({ taskId: tId });
          }}
          defaultStatus={defaultStatus}
        />
      )}

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        projectId={projectId}
        task={editingTask}
        participants={participants}
        onSuccess={() => fetchProjectData()}
      />

      {/* Task Details & Comments Panel */}
      <TaskDetailModal
        taskId={activeTaskId}
        projectOwnerId={project?.owner?._id || project?.owner}
        isOpen={!!activeTaskId}
        onClose={() => {
          setActiveTaskId(null);
          searchParams.delete('taskId');
          setSearchParams(searchParams);
        }}
        onTaskDeleted={(deletedId) => {
          setTasks((prev) => prev.filter((t) => t._id !== deletedId));
        }}
      />

      {/* Delete Task Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTaskConfirm}
        title="Delete Task"
        message={
          deletingTask
            ? `Are you sure you want to permanently delete task "${deletingTask.title}"? All associated comments will also be permanently deleted from MongoDB.`
            : ''
        }
        confirmText="Delete Task"
        cancelText="Cancel"
        danger={true}
        loading={deleteLoading}
      />
    </div>
  );
};

export default KanbanBoardPage;
