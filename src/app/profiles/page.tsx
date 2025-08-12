'use client';

import { useState } from 'react';
import { Navigation } from '../../components/Navigation';
import { ProfileList } from '../../components/ProfileList';
import { ProfileFilters } from '../../components/ProfileFilters';
import { BeltSystemAPI } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2 } from 'lucide-react';

export default function ProfilesPage() {
  const [filters, setFilters] = useState({
    limit: 10,
    offset: 0,
    profile_type: [] as string[],
    search: '',
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', filters],
    queryFn: () => BeltSystemAPI.getProfiles({
      limit: filters.limit,
      offset: filters.offset,
      profile_type: filters.profile_type,
      name: filters.search || undefined,
      order_by: 'name',
      order: 'asc',
    }),
    placeholderData: (prev) => prev,
  });

  const { data: totalCount } = useQuery({
    queryKey: ['profiles-count', filters],
    queryFn: () => BeltSystemAPI.getProfilesCount({
      limit: filters.limit,
      offset: filters.offset,
      profile_type: filters.profile_type,
      name: filters.search || undefined,
      description: filters.search || undefined,
    }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profiles</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage practitioner and organization profiles
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-0 mb-6">
          <ProfileFilters filters={filters} onFiltersChange={handleFilterChange} />
        </div>

        {/* Results count */}
        <div className="px-4 sm:px-0 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">{isLoading ? 'Loading...' : `Showing ${profiles?.length || 0} of ${totalCount || 0} profiles`}</p>
            {totalCount && totalCount > filters.limit && (
              <div className="text-sm text-gray-500">
                Page {Math.floor(filters.offset / filters.limit) + 1} of {Math.ceil(totalCount / filters.limit)}
              </div>
            )}
          </div>
        </div>

        {/* Profiles list */}
        <div className="px-4 sm:px-0">
          <ProfileList
            profiles={profiles || []}
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
