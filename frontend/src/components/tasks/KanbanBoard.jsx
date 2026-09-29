import React, { useState, useRef, useCallback } from 'react';
import { Plus, Search, X, Filter } from 'lucide-react';
import TaskCard from './TaskCard';
import EmptyState from '../common/EmptyState';
import { CheckSquare } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748B', bg: '#F8FAFC' },
  { id: 'in_progress', label: 'In Progress', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'review', label: 'Review', color: '#EA580C', bg: '#FFF7ED' },
  { id: 'completed', label: 'Completed', color: '#059669', bg: '#ECFDF5' },
];

const KanbanBoard = ({
  tasks,
  participants = [],
  currentUserId,
  isOwner,
  onTasksRefetch,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onViewDetails,
  defaultStatus,
}) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Drag state
  const draggedTask = useRef(null);
  const dragSourceCol = useRef(null);

  const filteredTasks = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAssignee === 'unassigned' && t.assignee) return false;
    if (filterAssignee && filterAssignee !== 'unassigned' && t.assignee?._id !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const hasFilters = search || filterAssignee || filterPriority;

  const getColumnTasks = (colId) => filteredTasks.filter((t) => t.status === colId);

  const handleDragStart = (e, task, colId) => {
    draggedTask.current = task;
    dragSourceCol.current = colId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', task._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    const task = draggedTask.current;
    if (!task || dragSourceCol.current === targetColId) return;

    // Optimistic update
    onTasksRefetch && onTasksRefetch((prev) =>
      prev.map((t) => t._id === task._id ? { ...t, status: targetColId } : t)
    );

    try {
      await api.patch(`/tasks/${task._id}/status`, { status: targetColId });
      showToast(`Task moved to ${COLUMNS.find((c) => c.id === targetColId)?.label}`);
    } catch (err) {
      showToast(err.message || 'Failed to update task status. Reverting.', 'error');
      onTasksRefetch && onTasksRefetch((prev) =>
        prev.map((t) => t._id === task._id ? { ...t, status: dragSourceCol.current } : t)
      );
    } finally {
      draggedTask.current = null;
      dragSourceCol.current = null;
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFilterAssignee('');
    setFilterPriority('');
  };

  return (
    <div>
      {/* Board Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-pill)',
          padding: '7px 14px',
          flex: '0 0 260px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '0.875rem', backgroundColor: 'transparent', width: '100%' }}
          />
          {search && <button onClick={() => setSearch('')}><X size={14} color="var(--text-muted)" /></button>}
        </div>

        {/* Assignee Filter */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '7px 14px', fontSize: '0.875rem' }}
          aria-label="Filter by assignee"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {participants.map((p) => (
            <option key={p._id} value={p._id}>{p.fullName}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="form-select"
          style={{ width: 'auto', padding: '7px 14px', fontSize: '0.875rem' }}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.8125rem',
              color: 'var(--accent-coral)',
              fontWeight: 600,
              padding: '7px 12px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--accent-coral-border)',
              backgroundColor: 'var(--accent-coral-bg)',
            }}
          >
            <X size={13} /> Clear Filters
          </button>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => onAddTask?.(defaultStatus || 'todo')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      {/* 4 Kanban Columns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        alignItems: 'start',
        minHeight: '400px',
      }}>
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px',
                minHeight: '320px',
                border: '2px dashed transparent',
                transition: 'border-color 0.15s ease',
              }}
              onDragEnter={(e) => { e.currentTarget.style.borderColor = col.color; }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: col.color }} />
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{col.label}</h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => onAddTask?.(col.id)}
                  title={`Add task to ${col.label}`}
                  style={{
                    width: '26px', height: '26px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = col.bg; e.currentTarget.style.color = col.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Task Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colTasks.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {hasFilters ? 'No matching tasks' : 'Drop tasks here'}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, col.id)}
                    >
                      <TaskCard
                        task={task}
                        currentUserId={currentUserId}
                        isOwner={isOwner}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onViewDetails={onViewDetails}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
