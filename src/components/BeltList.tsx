'use client';

import { BeltBadge } from './BeltDisplay';
import { formatDate } from '../lib/utils';
import { useMemo } from 'react';
import { RankInformation } from '../types/api';
import { Trophy, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { AwarderIcon } from '@/components/AwarderIcon';
import { ProfileName } from '@/components/ProfileName';

interface BeltListProps {
  belts: RankInformation[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (offset: number) => void;
}

export function BeltList({ 
  belts, 
  isLoading, 
  totalCount, 
  currentPage, 
  pageSize, 
  onPageChange 
}: BeltListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  // Remove batch name fetch; names resolve progressively via ProfileName per row

  const sortedBelts = useMemo(() => {
    const arr = Array.isArray(belts) ? [...belts] : [];
    arr.sort((a, b) => new Date(b.achievement_date).getTime() - new Date(a.achievement_date).getTime());
    return arr;
  }, [belts]);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!belts || belts.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-12 sm:px-6">
          <div className="text-center">
            <Trophy className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No belts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 -mx-4 -mt-5 px-4 py-3 mb-4 flex items-center justify-between border-b border-gray-200 sm:px-6 sm:rounded-t-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange((currentPage - 1) * pageSize)}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange((currentPage + 1) * pageSize)}
                disabled={currentPage === totalPages - 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{currentPage * pageSize + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * pageSize, totalCount)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalCount}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onPageChange((currentPage - 1) * pageSize)}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onPageChange((currentPage + 1) * pageSize)}
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Belt List */}
        <div className="space-y-4">
          {sortedBelts.map((belt) => (
            <div key={belt.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-400 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <BeltBadge belt={belt.belt} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <ProfileName id={belt.achieved_by_profile_id} className="text-sm font-medium text-gray-900" />
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(belt.achievement_date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <AwarderIcon id={belt.awarded_by_profile_id} />
                  <ProfileName id={belt.awarded_by_profile_id} className="text-sm text-gray-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 -mx-4 -mb-5 px-4 py-3 mt-4 flex items-center justify-between border-t border-gray-200 sm:px-6 sm:rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange((currentPage - 1) * pageSize)}
                disabled={currentPage === 0}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange((currentPage + 1) * pageSize)}
                disabled={currentPage === totalPages - 1}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{currentPage * pageSize + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min((currentPage + 1) * pageSize, totalCount)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalCount}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => onPageChange((currentPage - 1) * pageSize)}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => onPageChange((currentPage + 1) * pageSize)}
                    disabled={currentPage === totalPages - 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
