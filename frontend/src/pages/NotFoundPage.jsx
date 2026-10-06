import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: 'var(--primary)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <Layers size={28} strokeWidth={2.5} />
      </div>

      <h1
        style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          lineHeight: 1,
          marginBottom: '12px',
        }}
      >
        404
      </h1>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
        Page Not Found
      </h2>

      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--text-secondary)',
          maxWidth: '420px',
          marginBottom: '24px',
          lineHeight: 1.5,
        }}
      >
        The page, project, or task you requested doesn't exist or you don't have permission to access it.
      </p>

      <Button
        variant="primary"
        icon={<ArrowLeft size={16} />}
        onClick={() => navigate('/dashboard')}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};

export default NotFoundPage;
