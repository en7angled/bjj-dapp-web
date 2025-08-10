'use client';

import { BeltBadge } from './BeltDisplay';
import { formatDate, truncateAddress } from '../lib/utils';
import { RankInformation } from '../types/api';
import { Trophy, User, Award, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {belts.map((belt) => (
              <li key={belt.id} className="py-5">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <BeltBadge belt={belt.belt} />
                      <span className="text-sm text-gray-500">
                        {formatDate(belt.achievement_date)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-900">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Achieved by:</span>
                        </div>
                        <div className="ml-6 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {truncateAddress(belt.achieved_by_profile_id, 12)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Awarded by:</span>
                        </div>
                        <div className="ml-6 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {truncateAddress(belt.awarded_by_profile_id, 12)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-gray-500">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDate(belt.achievement_date)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onPageChange(i * pageSize)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      i === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => onPageChange((currentPage + 1) * pageSize)}
                  disabled={currentPage === totalPages - 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
