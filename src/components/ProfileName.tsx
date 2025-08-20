'use client';

import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { truncateAddress } from '../lib/utils';

interface ProfileNameProps {
  id?: string;
  className?: string;
  truncate?: number; // number of chars for fallback truncation
}

export function ProfileName({ id, className, truncate = 12 }: ProfileNameProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['profile-name', id],
    queryFn: () => BeltSystemAPI.resolveProfileName(id || ''),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60 * 24, // 24h - profile names don't change often
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  const fallback = id ? truncateAddress(id, truncate) : '';
  return <span className={className}>{isLoading ? fallback : (data || fallback)}</span>;
}


