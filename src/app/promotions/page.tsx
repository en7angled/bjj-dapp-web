'use client';

import { useState } from 'react';
import { Navigation } from '../../components/Navigation';
import { PromotionList } from '../../components/PromotionList';
import { PromotionFilters } from '../../components/PromotionFilters';
import { BeltSystemAPI } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Clock } from 'lucide-react';

export default function PromotionsPage() {
  const [filters, setFilters] = useState({
    limit: 20,
    offset: 0,
    profile: [] as string[],
    belt: [] as string[],
    achieved_by: [] as string[],
    awarded_by: [] as string[],
    from: '',
    to: '',
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', filters],
    queryFn: () => BeltSystemAPI.getPromotions(filters),
  });

  const { data: totalCount } = useQuery({
    queryKey: ['promotions-count', filters],
    queryFn: () => BeltSystemAPI.getPromotionsCount(filters),
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
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage pending belt promotions and rank advancements
              </p>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Promotions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : totalCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-0 mb-6">
          <PromotionFilters filters={filters} onFiltersChange={handleFilterChange} />
        </div>

        {/* Results count */}
        <div className="px-4 sm:px-0 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              {isLoading ? 'Loading...' : `Showing ${promotions?.length || 0} of ${totalCount || 0} promotions`}
            </p>
            {totalCount && totalCount > filters.limit && (
              <div className="text-sm text-gray-500">
                Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(totalCount / filters.limit)}
              </div>
            )}
          </div>
        </div>

        {/* Promotions list */}
        <div className="px-4 sm:px-0">
          <PromotionList
            promotions={promotions || []}
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
