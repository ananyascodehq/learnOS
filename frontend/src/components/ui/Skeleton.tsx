import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div
    className={`animate-pulse bg-white/10 rounded ${className}`}
    style={style}
    aria-busy="true"
    aria-live="polite"
  />
);

export default Skeleton;
