import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, CheckSquare, AlertTriangle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/common/Skeleton';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import ProjectModal from '../components/projects/ProjectModal';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

const StatCard = ({ value, label, icon, color, bg }) => (
  <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { size: 22, color })}
    </div>
    <div>
      <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 500 }}>{label}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const stats = data?.stats || {};

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span style={{ color: 'var(--accent-blue)' }}>{user?.fullName?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Here's an overview of your projects and tasks.
          </p>
        </div>
        <button
          onClick={() => setShowCreateProject(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary)', color: '#FFFFFF',
            fontWeight: 700, fontSize: '0.9375rem', boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Plus size={18} /> New Project
        </button>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--accent-coral-bg)', color: 'var(--accent-coral)', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--accent-coral-border)', fontWeight: 500 }}>
          {error} <button onClick={fetchDashboard} style={{ marginLeft: '8px', color: 'var(--accent-coral)', textDecoration: 'underline', fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[1,2,3,4].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <StatCard value={stats.myProjectsCount ?? 0} label="My Projects" icon={<FolderKanban />} color="#2563EB" bg="#EFF6FF" />
          <StatCard value={stats.myOpenTasksCount ?? 0} label="Open Tasks" icon={<CheckSquare />} color="#7C3AED" bg="#F5F3FF" />
          <StatCard value={stats.dueThisWeekCount ?? 0} label="Due This Week" icon={<Clock />} color="#D97706" bg="#FFFBEB" />
          <StatCard value={stats.overdueCount ?? 0} label="Overdue" icon={<AlertTriangle />} color="#E63946" bg="#FFF1F2" />
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Project Progress */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Project Progress</h2>
            <button onClick={() => navigate('/projects')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
              View all <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[1,2,3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : (data?.projectProgress?.length ?? 0) === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '14px' }}>No projects yet.</p>
              <button onClick={() => setShowCreateProject(true)} style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.875rem' }}>Create your first project →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.projectProgress.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}/board`)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.backgroundColor = 'var(--bg-app)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{proj.name}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: proj.progress === 100 ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                      {proj.progress}%
                    </span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${proj.progress}%`, backgroundColor: proj.progress === 100 ? 'var(--accent-green)' : 'var(--accent-blue)', borderRadius: 'var(--radius-pill)', transition: 'width 0.4s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {proj.completedTaskCount} / {proj.taskCount} tasks completed
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tasks Due Soon */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Tasks Due Soon</h2>
              <button onClick={() => navigate('/my-tasks')} style={{ fontSize: '0.8125rem', color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{[1,2,3].map((i) => <CardSkeleton key={i} />)}</div>
            ) : (data?.tasksDueSoon?.length ?? 0) === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '16px 0', textAlign: 'center' }}>No tasks due soon.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.tasksDueSoon.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/projects/${task.project?._id}/board?taskId=${task._id}`)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project?.name}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      <Badge type="priority" value={task.priority} />
                      <span style={{ fontSize: '0.75rem', color: new Date(task.dueDate) < new Date() ? 'var(--accent-coral)' : 'var(--text-muted)', fontWeight: 500 }}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{[1,2,3].map((i) => <CardSkeleton key={i} />)}</div>
            ) : (data?.recentActivity?.length ?? 0) === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>No recent activity.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.recentActivity.map((task) => (
                  <div key={task._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Avatar user={task.createdBy} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                        <strong>{task.createdBy?.fullName}</strong>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>updated</span>{' '}
                        <strong>{task.title}</strong>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {task.project?.name} · {formatDate(task.updatedAt)}
                      </p>
                    </div>
                    <Badge type="status" value={task.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSuccess={() => { setShowCreateProject(false); fetchDashboard(); }}
      />
    </div>
  );
};

export default DashboardPage;
