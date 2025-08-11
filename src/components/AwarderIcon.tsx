'use client';

import { useQuery } from '@tanstack/react-query';
import { Award } from 'lucide-react';
import { BeltSystemAPI } from '../lib/api';
import { beltColors } from '../lib/utils';
import type { BJJBelt } from '../types/api';

interface AwarderIconProps {
  id?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function AwarderIcon({ id, className = '', size = 'md' }: AwarderIconProps) {
  const { data: awarderBelt } = useQuery({
    queryKey: ['awarder-belt', id],
    queryFn: async (): Promise<BJJBelt | null> => {
      if (!id) return null;
      try {
        const pr = await BeltSystemAPI.getPractitionerProfile(id);
        return pr?.current_rank?.belt ?? null;
      } catch {
        return null; // likely an organization or not found
      }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const bgColor = awarderBelt ? beltColors[awarderBelt] : '#D1D5DB';
  const iconColor = awarderBelt === 'White' ? '#111827' : '#FFFFFF';
  const containerSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center justify-center rounded-full ${containerSize} ${className}`} style={{ backgroundColor: bgColor }}>
      <Award className={iconSize} style={{ color: iconColor }} />
    </span>
  );
}


