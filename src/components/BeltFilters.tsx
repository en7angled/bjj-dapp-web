'use client';

import { useState } from 'react';
import { beltOrder } from '../lib/utils';
import { BJJBelt } from '../types/api';
import { Filter, X, Calendar } from 'lucide-react';

interface BeltFiltersProps {
  filters: {
    limit: number;
    offset: number;
    profile: string[];
    belt: BJJBelt[];
    achieved_by: string[];
    awarded_by: string[];
    from: string;
    to: string;
  };
  onFiltersChange: (filters: BeltFiltersProps['filters']) => void;
}

export function BeltFilters({ filters, onFiltersChange }: BeltFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof typeof filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      profile: [],
      belt: [],
      achieved_by: [],
      awarded_by: [],
      from: '',
      to: '',
    });
  };

  const hasActiveFilters = filters.profile.length > 0 || 
                          filters.belt.length > 0 || 
                          filters.achieved_by.length > 0 || 
                          filters.awarded_by.length > 0 || 
                          filters.from || 
                          filters.to;

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
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isExpanded ? 'Hide' : 'Show'} filters
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-4 space-y-4">
          {/* Belt type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belt Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {beltOrder.map((belt) => (
                <label key={belt} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.belt.includes(belt)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('belt', [...filters.belt, belt]);
                      } else {
                        updateFilter('belt', filters.belt.filter(b => b !== belt));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{belt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date range filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter('from', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter('to', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Profile filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achieved By Profile
              </label>
              <input
                type="text"
                placeholder="Enter profile ID"
                value={filters.achieved_by.join(', ')}
                onChange={(e) => updateFilter('achieved_by', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple IDs with commas
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Awarded By Profile
              </label>
              <input
                type="text"
                placeholder="Enter profile ID"
                value={filters.awarded_by.join(', ')}
                onChange={(e) => updateFilter('awarded_by', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separate multiple IDs with commas
              </p>
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
      )}
    </div>
  );
}
