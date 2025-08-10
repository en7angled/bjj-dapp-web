'use client';

import { beltColors, getBeltDisplayName } from '../lib/utils';
import type { BJJBelt } from '../types/api';

interface BeltDisplayProps {
  belt: BJJBelt;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function BeltDisplay({ belt, size = 'md', showLabel = true, className = '' }: BeltDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-2',
    md: 'w-12 h-3',
    lg: 'w-16 h-4'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border border-gray-300 shadow-sm`}
        style={{
          backgroundColor: beltColors[belt],
          borderColor: belt === 'White' ? '#D1D5DB' : beltColors[belt]
        }}
      />
      {showLabel && (
        <span className={`font-medium text-gray-700 ${textSizes[size]}`}>
          {getBeltDisplayName(belt)}
        </span>
      )}
    </div>
  );
}

export function BeltBadge({ belt, className = '' }: { belt: BJJBelt; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${beltColors[belt]}20`,
        color: belt === 'White' ? '#374151' : beltColors[belt],
        border: `1px solid ${belt === 'White' ? '#D1D5DB' : beltColors[belt]}40`
      }}
    >
      {getBeltDisplayName(belt)}
    </span>
  );
}
