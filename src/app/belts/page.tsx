'use client';

import { useState } from 'react';
import { Navigation } from '../../components/Navigation';
import { BeltList } from '@/components/BeltList';
import { BeltFilters } from '@/components/BeltFilters';
import { BeltSystemAPI } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import type { BJJBelt } from '../../types/api';

export default function BeltsPage() {
  const [filters, setFilters] = useState({
    limit: 10,
    offset: 0,
    profile: [] as string[],
    belt: [] as BJJBelt[],
    achieved_by: [] as string[],
    awarded_by: [] as string[],
    from: '',
    to: '',
  });

  const { data: belts, isLoading } = useQuery({
    queryKey: ['belts', filters],
    queryFn: () => BeltSystemAPI.getBelts({ ...filters, order_by: 'date', order: 'desc' }),
    placeholderData: (prev) => prev,
  });

  const countFilters = {
    profile: filters.profile,
    belt: filters.belt,
    achieved_by: filters.achieved_by,
    awarded_by: filters.awarded_by,
    from: filters.from,
    to: filters.to,
  };
  const { data: totalCount } = useQuery({
    queryKey: ['belts-count', countFilters],
    queryFn: () => BeltSystemAPI.getBeltsCount(countFilters),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60, // 1 min
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters({ ...newFilters, offset: 0 });
  };

  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Belts</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and filter all belt achievements across the network
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-0 mb-6">
          <BeltFilters filters={filters} onFiltersChange={handleFilterChange} />
        </div>

        {/* Results count */}
        <div className="px-4 sm:px-0 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {isLoading ? 'Loading...' : `Showing ${belts?.length || 0} of ${totalCount || 0} belts`}
            </p>
            {totalCount && totalCount > filters.limit && (
              <div className="text-sm text-gray-500">
                Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(totalCount / filters.limit)}
              </div>
            )}
          </div>
        </div>

        {/* Belts list */}
        <div className="px-4 sm:px-0">
          <BeltList 
            belts={belts || []} 
            isLoading={isLoading}
            totalCount={totalCount || 0}
            currentPage={Math.floor(filters.offset / filters.limit)}
            pageSize={filters.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </div>
  );
}
