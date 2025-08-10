'use client';

import { ProfileData, PractitionerProfileInformation, OrganizationProfileInformation } from '../types/api';
import { truncateAddress, formatDate } from '../lib/utils';
import { BeltBadge } from './BeltDisplay';
import { User, Building2, MapPin, Calendar, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface ProfileListProps {
  profiles: ProfileData[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (offset: number) => void;
}

export function ProfileList({
  profiles,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange
}: ProfileListProps) {
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

  if (!profiles || profiles.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-12 sm:px-6">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No profiles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search criteria.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderPractitionerProfile = (profile: PractitionerProfileInformation) => (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            {profile.name || 'Unnamed Practitioner'}
          </h3>
          {profile.current_belt && (
            <BeltBadge belt={profile.current_belt} />
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {profile.description && (
            <p className="text-gray-700">{profile.description}</p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Joined: {formatDate(profile.created_at)}</span>
            </div>
            {profile.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-xs text-gray-500 font-mono">
          {truncateAddress(profile.id, 12)}
        </div>
        <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1">
          <span>View</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  const renderOrganizationProfile = (profile: OrganizationProfileInformation) => (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            {profile.name || 'Unnamed Organization'}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Organization
          </span>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {profile.description && (
            <p className="text-gray-700">{profile.description}</p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Founded: {formatDate(profile.created_at)}</span>
            </div>
            {profile.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <div className="text-xs text-gray-500 font-mono">
          {truncateAddress(profile.id, 12)}
        </div>
        <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1">
          <span>View</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {profiles.map((profile) => (
              <li key={profile.id} className="py-5">
                {profile.profile_type === 'practitioner' 
                  ? renderPractitionerProfile(profile as PractitionerProfileInformation)
                  : renderOrganizationProfile(profile as OrganizationProfileInformation)
                }
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
