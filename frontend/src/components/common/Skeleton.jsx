import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '8px', className = '', style = {} }) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#EAE5DC',
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width="60%" height="24px" />
      <Skeleton width="20%" height="20px" borderRadius="9999px" />
    </div>
    <Skeleton width="85%" height="16px" />
    <Skeleton width="40%" height="16px" />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
      <Skeleton width="30%" height="24px" />
      <Skeleton width="25%" height="32px" borderRadius="6px" />
    </div>
  </div>
);

export default Skeleton;
