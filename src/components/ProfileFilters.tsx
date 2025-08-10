'use client';

import { Filter, X, Search, User, Building2 } from 'lucide-react';

interface ProfileFiltersProps {
  filters: {
    limit: number;
    offset: number;
    profile_type: string[];
    search: string;
  };
  onFiltersChange: (filters: ProfileFiltersProps['filters']) => void;
}

export function ProfileFilters({ filters, onFiltersChange }: ProfileFiltersProps) {
  const updateFilter = (key: keyof typeof filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      profile_type: [],
      search: '',
    });
  };

  const hasActiveFilters = filters.profile_type.length > 0 || filters.search;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            Search Profiles
          </label>
          <input
            type="text"
            placeholder="Search by name, description, or other details..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Profile type filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.profile_type.includes('practitioner')}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFilter('profile_type', [...filters.profile_type, 'practitioner']);
                  } else {
                    updateFilter('profile_type', filters.profile_type.filter(t => t !== 'practitioner'));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Practitioner</span>
            </label>

            <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.profile_type.includes('organization')}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFilter('profile_type', [...filters.profile_type, 'organization']);
                  } else {
                    updateFilter('profile_type', filters.profile_type.filter(t => t !== 'organization'));
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Building2 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-700">Organization</span>
            </label>
          </div>
        </div>

        {/* Results per page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Results per page
          </label>
          <select
            value={filters.limit}
            onChange={(e) => updateFilter('limit', parseInt(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
}
