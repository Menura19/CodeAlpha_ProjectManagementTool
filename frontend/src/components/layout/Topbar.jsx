import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, X } from 'lucide-react';
import api from '../../api/client';
import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

const Topbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 36px',
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      {/* Global Authorized Search */}
      <div ref={searchRef} style={{ position: 'relative', width: '380px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 16px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'border-color 0.15s ease',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search projects or tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results) setIsOpen(true);
            }}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem',
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              style={{ color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && results && (
          <div
            style={{
              position: 'absolute',
              top: '46px',
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-modal)',
              border: '1px solid var(--border-medium)',
              padding: '12px',
              maxHeight: '380px',
              overflowY: 'auto',
              zIndex: 200,
            }}
          >
            {results.projects.length === 0 && results.tasks.length === 0 ? (
              <p style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No accessible projects or tasks match "{query}"
              </p>
            ) : (
              <>
                {results.projects.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Projects
                    </p>
                    {results.projects.map((proj) => (
                      <div
                        key={proj._id}
                        onClick={() => {
                          navigate(`/projects/${proj._id}/board`);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <FolderKanban size={16} color="var(--accent-blue)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{proj.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {results.tasks.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 8px' }}>
                      Tasks
                    </p>
                    {results.tasks.map((task) => (
                      <div
                        key={task._id}
                        onClick={() => {
                          navigate(`/projects/${task.project._id}/board?taskId=${task._id}`);
                          setIsOpen(false);
                          setQuery('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <CheckSquare size={16} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </span>
                        </div>
                        <Badge type="status" value={task.status} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Topbar User Profile badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 10px 4px 6px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Avatar user={user} size="sm" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.fullName}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
