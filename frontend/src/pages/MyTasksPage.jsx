import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  X,
  Calendar,
  MessageSquare,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import TaskModal from '../components/tasks/TaskModal';
import Modal from '../components/common/Modal';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isOverdue = (d) => d && new Date(d) < new Date();

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
];

const MyTasksPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'due_today', 'overdue', 'completed'
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [search, setSearch] = useState('');

  // Selection & Batch actions
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [batchRescheduleOpen, setBatchRescheduleOpen] = useState(false);
  const [batchDueDate, setBatchDueDate] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  // Task details & New Task modal
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [selectedProjectForNewTask, setSelectedProjectForNewTask] = useState('');

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterTab !== 'all') params.filter = filterTab;
      if (selectedProject) params.project = selectedProject;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (search.trim()) params.search = search.trim();

      const [tasksRes, projRes] = await Promise.all([
        api.get('/tasks/my', { params }),
        api.get('/projects'),
      ]);

      setTasks(tasksRes.data.tasks || []);
      setProjects(projRes.data.projects || []);
    } catch (err) {
      setError(err.message || 'Failed to load your tasks.');
    } finally {
      setLoading(false);
    }
  }, [filterTab, selectedProject, selectedStatus, selectedPriority, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyTasks();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchMyTasks]);

  // Handle Quick Status Change
  const handleQuickStatusChange = async (taskId, newStatus) => {
    const oldTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      showToast('Status updated.');
    } catch (err) {
      setTasks(oldTasks);
      showToast(err.message || 'Failed to update status.', 'error');
    }
  };

  // Selection management
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTaskIds(tasks.map((t) => t._id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Batch mark completed
  const handleBatchComplete = async () => {
    if (selectedTaskIds.length === 0) return;
    setBatchLoading(true);
    try {
      await api.patch('/tasks/batch/complete', { taskIds: selectedTaskIds });
      showToast(`${selectedTaskIds.length} tasks marked as Completed.`);
      setSelectedTaskIds([]);
      fetchMyTasks();
    } catch (err) {
      showToast(err.message || 'Failed to mark tasks as completed.', 'error');
    } finally {
      setBatchLoading(false);
    }
  };

  // Batch reschedule
  const handleBatchReschedule = async () => {
    if (selectedTaskIds.length === 0) return;
    setBatchLoading(true);
    try {
      await api.patch('/tasks/batch/reschedule', {
        taskIds: selectedTaskIds,
        dueDate: batchDueDate || null,
      });
      showToast(`${selectedTaskIds.length} tasks rescheduled.`);
      setSelectedTaskIds([]);
      setBatchRescheduleOpen(false);
      fetchMyTasks();
    } catch (err) {
      showToast(err.message || 'Failed to reschedule tasks.', 'error');
    } finally {
      setBatchLoading(false);
    }
  };

  const hasFilters = search || selectedProject || selectedStatus || selectedPriority;

  return (
    <div>
      {/* Page Header */}
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '2px' }}>
            All active tasks assigned to you across projects.
          </p>
        </div>

        {projects.length > 0 && (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setSelectedProjectForNewTask(projects[0]._id);
              setCreateTaskModalOpen(true);
            }}
          >
            New Task
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          width: 'fit-content',
          marginBottom: '20px',
        }}
      >
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'due_today', label: 'Due Today' },
          { id: 'overdue', label: 'Overdue' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setFilterTab(tab.id);
              setSelectedTaskIds([]);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              fontWeight: filterTab === tab.id ? 700 : 500,
              backgroundColor: filterTab === tab.id ? '#FFFFFF' : 'transparent',
              color: filterTab === tab.id ? 'var(--text-main)' : 'var(--text-secondary)',
              boxShadow: filterTab === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar: Filters & Batch Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-pill)',
              padding: '7px 14px',
              width: '240px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search your tasks…"
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

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '7px 14px', fontSize: '0.875rem' }}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '7px 14px', fontSize: '0.875rem' }}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedProject('');
                setSelectedStatus('');
                setSelectedPriority('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8125rem',
                color: 'var(--accent-coral)',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--accent-coral-border)',
                backgroundColor: 'var(--accent-coral-bg)',
              }}
            >
              <X size={13} /> Clear Filters
            </button>
          )}
        </div>

        {/* Batch Actions Bar when tasks are selected */}
        {selectedTaskIds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1E2028',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8125rem',
              boxShadow: 'var(--shadow-hover)',
            }}
          >
            <span style={{ fontWeight: 600 }}>{selectedTaskIds.length} selected</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <button
              onClick={handleBatchComplete}
              disabled={batchLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#34D399',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} /> Mark Completed
            </button>
            <span style={{ opacity: 0.4 }}>|</span>
            <button
              onClick={() => setBatchRescheduleOpen(true)}
              disabled={batchLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#60A5FA',
                fontWeight: 600,
              }}
            >
              <Calendar size={14} /> Reschedule
            </button>
          </div>
        )}
      </div>

      {/* Tasks Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Skeleton width="20px" height="20px" />
                <Skeleton width="45%" height="18px" />
                <Skeleton width="15%" height="18px" />
                <Skeleton width="15%" height="18px" />
                <Skeleton width="15%" height="18px" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={48} color="var(--text-muted)" />}
            title="No assigned tasks"
            message={
              hasFilters
                ? 'No tasks match the active filters or search keyword.'
                : filterTab === 'due_today'
                ? 'You have no tasks due today. Great job keeping on top of your work!'
                : filterTab === 'overdue'
                ? 'No overdue tasks found. Everything is on schedule.'
                : filterTab === 'completed'
                ? 'No completed tasks yet. Move your active tasks to Completed as you finish them.'
                : 'Tasks assigned to you will appear here. Create a task in any project and assign it to yourself.'
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                  </th>
                  <th style={{ padding: '12px 16px' }}>Task Title</th>
                  <th style={{ padding: '12px 16px' }}>Project</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Due Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'completed';
                  const isSelected = selectedTaskIds.includes(task._id);

                  return (
                    <tr
                      key={task._id}
                      style={{
                        borderBottom: index < tasks.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        backgroundColor: isSelected ? '#F8FAFC' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '14px 16px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectTask(task._id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                        />
                      </td>

                      {/* Title & Comment Count */}
                      <td style={{ padding: '14px 16px', minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            onClick={() => setActiveTaskId(task._id)}
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                          >
                            {task.title}
                          </span>
                          {task.commentCount > 0 && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              <MessageSquare size={12} />
                              {task.commentCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Project Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          onClick={() => navigate(`/projects/${task.project?._id}/board`)}
                          style={{
                            fontSize: '0.8125rem',
                            color: 'var(--accent-blue)',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {task.project?.name || '—'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '14px 16px' }}>
                        <Badge type="priority" value={task.priority} />
                      </td>

                      {/* Status Dropdown */}
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task._id, e.target.value)}
                          className="form-select"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.8125rem',
                            borderRadius: 'var(--radius-sm)',
                            width: 'auto',
                            fontWeight: 600,
                          }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: overdue ? 700 : 500,
                            color: overdue ? 'var(--accent-coral)' : 'var(--text-secondary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {overdue && <AlertCircle size={13} />}
                          {formatDate(task.dueDate)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setActiveTaskId(task._id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-main)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-subtle)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#18191E';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                            e.currentTarget.style.color = 'var(--text-main)';
                          }}
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      <TaskDetailModal
        taskId={activeTaskId}
        isOpen={!!activeTaskId}
        onClose={() => setActiveTaskId(null)}
        onTaskUpdated={() => fetchMyTasks()}
        onTaskDeleted={() => {
          setActiveTaskId(null);
          fetchMyTasks();
        }}
      />

      {/* Batch Reschedule Dialog */}
      <Modal
        isOpen={batchRescheduleOpen}
        onClose={() => setBatchRescheduleOpen(false)}
        title={`Reschedule ${selectedTaskIds.length} Tasks`}
        maxWidth="440px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBatchRescheduleOpen(false)} disabled={batchLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBatchReschedule} loading={batchLoading}>
              Update Due Date
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Choose a new target completion date for all {selectedTaskIds.length} selected tasks:
          </p>
          <input
            type="date"
            value={batchDueDate}
            onChange={(e) => setBatchDueDate(e.target.value)}
            className="form-input"
          />
        </div>
      </Modal>

      {/* Create Task Modal when triggered from My Tasks */}
      {selectedProjectForNewTask && (
        <TaskModal
          isOpen={createTaskModalOpen}
          onClose={() => {
            setCreateTaskModalOpen(false);
            setSelectedProjectForNewTask('');
          }}
          projectId={selectedProjectForNewTask}
          participants={[{ _id: user?._id, fullName: user?.fullName }]}
          onSuccess={() => fetchMyTasks()}
        />
      )}
    </div>
  );
};

export default MyTasksPage;
