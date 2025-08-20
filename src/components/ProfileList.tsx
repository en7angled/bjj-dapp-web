'use client';

import { ProfileSummary } from '../types/api';
import { User, Building2, ChevronLeft, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';
import { ProfileName } from './ProfileName';
import Link from 'next/link';
import { useState } from 'react';
import { truncateAddress } from '../lib/utils';
import { ListSkeleton, EmptyState } from './LoadingStates';

interface ProfileListProps {
  profiles: ProfileSummary[];
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy ID:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ListSkeleton count={5} showImage={true} />
        </div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-12 sm:px-6">
          <EmptyState
            icon={User}
            title="No profiles found"
            description="Try adjusting your filters or search criteria."
          />
        </div>
      </div>
    );
  }

  const renderPractitionerProfile = (profile: ProfileSummary) => (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        {profile.image_uri && profile.image_uri !== '' ? (
          <img 
            src={profile.image_uri} 
            alt={`${profile.name || 'Practitioner'} profile`}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center ${profile.image_uri && profile.image_uri !== '' ? 'hidden' : ''}`}>
          <User className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            {profile.name || 'Unnamed Practitioner'}
          </h3>
          <Link href={`/profiles/${profile.id}`}>
            <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1">
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {profile.description && (
            <p className="text-gray-700">{profile.description}</p>
          )}
        </div>
        <div className="text-xs text-gray-500 font-mono mt-2 flex items-center space-x-2">
          <span>{truncateAddress(profile.id, 12)}</span>
          <button
            onClick={() => handleCopyId(profile.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy profile ID"
          >
            {copiedId === profile.id ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrganizationProfile = (profile: ProfileSummary) => (
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        {profile.image_uri && profile.image_uri !== '' ? (
          <img 
            src={profile.image_uri} 
            alt={`${profile.name || 'Organization'} profile`}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center ${profile.image_uri && profile.image_uri !== '' ? 'hidden' : ''}`}>
          <Building2 className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-medium text-gray-900">
              {profile.name || 'Unnamed Organization'}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Organization
            </span>
          </div>
          <Link href={`/profiles/${profile.id}`}>
            <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1">
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </Link>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          {profile.description && (
            <p className="text-gray-700">{profile.description}</p>
          )}
        </div>
        <div className="text-xs text-gray-500 font-mono mt-2 flex items-center space-x-2">
          <span>{truncateAddress(profile.id, 12)}</span>
          <button
            onClick={() => handleCopyId(profile.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy profile ID"
          >
            {copiedId === profile.id ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

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
        <div className="flow-root">
          <ul className="-my-5 divide-y divide-gray-200">
            {profiles.map((profile) => (
              <li key={profile.id} className="py-5">
                {profile.type === 'Practitioner' 
                  ? renderPractitionerProfile(profile)
                  : renderOrganizationProfile(profile)
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
