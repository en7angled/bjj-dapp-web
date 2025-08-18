'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigation } from '../../../components/Navigation';
import { BeltSystemAPI } from '../../../lib/api';
import { ProfileName } from '../../../components/ProfileName';
import { BeltBadge } from '../../../components/BeltDisplay';
import { formatDate } from '../../../lib/utils';
import { User, Building2, Trophy, Calendar, MapPin, Phone, Mail, Globe, Shield, Copy, Check } from 'lucide-react';
import { beltColors } from '../../../lib/utils';
import type { BJJBelt } from '../../../types/api';

export default function PublicProfilePage() {
  const params = useParams();
  const profileId = params.id as string;
  const [copiedProfileId, setCopiedProfileId] = useState(false);

  // Copy profile ID to clipboard
  async function copyProfileIdToClipboard() {
    if (!profileId) return;
    try {
      await navigator.clipboard.writeText(profileId);
      setCopiedProfileId(true);
      setTimeout(() => setCopiedProfileId(false), 2000);
    } catch {
      // ignore
    }
  }

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', profileId],
    queryFn: async () => {
      // Only fetch as practitioner profile
      try {
        return await BeltSystemAPI.getPractitionerProfile(profileId);
      } catch {
        throw new Error('Profile not found');
      }
    },
    enabled: Boolean(profileId),
  });

  // Fetch profile metadata
  const { data: metadata } = useQuery({
    queryKey: ['profile-metadata', profileId],
    queryFn: () => BeltSystemAPI.getProfileMetadata(profileId),
    enabled: Boolean(profileId),
  });

  // Fetch belts for this profile
  const { data: belts, isLoading: beltsLoading } = useQuery({
    queryKey: ['profile-belts', profileId],
    queryFn: () => BeltSystemAPI.getBelts({ achieved_by: [profileId] }),
    enabled: Boolean(profileId),
  });

  // Fetch promotions for this profile
  const { data: promotions, isLoading: promotionsLoading } = useQuery({
    queryKey: ['profile-promotions', profileId],
    queryFn: () => BeltSystemAPI.getPromotions({ achieved_by: [profileId] }),
    enabled: Boolean(profileId),
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-6"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h1 className="mt-2 text-2xl font-bold text-gray-900">Profile Not Found</h1>
              <p className="mt-1 text-sm text-gray-500">
                The profile you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isPractitioner = 'current_rank' in profile && 'previous_ranks' in profile;
  const currentBelt = isPractitioner && (profile as any).current_rank ? (profile as any).current_rank.belt : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex items-center space-x-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {profile.image_uri && profile.image_uri !== '' ? (
                    <img 
                      src={profile.image_uri} 
                      alt={`${profile.name} profile`}
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show the placeholder div
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) {
                          placeholder.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    profile.image_uri && profile.image_uri !== '' ? 'hidden' : ''
                  } ${
                    isPractitioner 
                      ? 'bg-gradient-to-br from-blue-400 to-purple-500' 
                      : 'bg-gradient-to-br from-green-400 to-teal-500'
                  }`}>
                    {isPractitioner ? (
                      <User className="w-12 h-12 text-white" />
                    ) : (
                      <Building2 className="w-12 h-12 text-white" />
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.name || 'Unnamed Profile'}
                    </h1>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isPractitioner 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isPractitioner ? 'Practitioner' : 'Organization'}
                    </span>
                    {currentBelt && (
                      <BeltBadge belt={currentBelt} />
                    )}
                  </div>
                  
                  {profile.description && (
                    <p className="text-lg text-gray-600 mb-4">
                      {profile.description}
                    </p>
                  )}

                  {/* Profile ID */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Profile ID</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                          {profileId}
                        </p>
                      </div>
                      <button
                        onClick={copyProfileIdToClipboard}
                        className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title="Copy Profile ID"
                      >
                        {copiedProfileId ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
          {/* Profile Metadata */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {metadata?.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{metadata.location}</span>
                    </div>
                  )}
                  {metadata?.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{metadata.phone}</span>
                    </div>
                  )}
                  {metadata?.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{metadata.email}</span>
                    </div>
                  )}
                  {metadata?.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <a 
                        href={metadata.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {metadata.website}
                      </a>
                    </div>
                  )}
                  {(!metadata?.location && !metadata?.phone && !metadata?.email && !metadata?.website) && (
                    <p className="text-sm text-gray-500 italic">No contact information available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Belts and Promotions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Belts */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 text-blue-600 mr-2" />
                  Belt Achievements
                </h3>
                {beltsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : belts && belts.length > 0 ? (
                  <div className="space-y-3">
                    {belts.map((belt) => (
                      <div key={belt.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: beltColors[belt.belt] }}>
                            <Trophy className="w-5 h-5" style={{ color: belt.belt === 'White' ? '#111827' : '#FFFFFF' }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <BeltBadge belt={belt.belt} />
                            <span className="text-sm text-gray-500">
                              {formatDate(belt.achievement_date)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Awarded by: <ProfileName id={belt.awarded_by_profile_id} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No belt achievements yet</p>
                )}
              </div>
            </div>

            {/* Promotions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                  Recent Promotions
                </h3>
                {promotionsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : promotions && promotions.length > 0 ? (
                  <div className="space-y-3">
                    {promotions.slice(0, 5).map((promotion) => (
                      <div key={promotion.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: beltColors[promotion.belt] }}>
                            <Trophy className="w-5 h-5" style={{ color: promotion.belt === 'White' ? '#111827' : '#FFFFFF' }} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <BeltBadge belt={promotion.belt} />
                            <span className="text-sm text-gray-500">
                              {formatDate(promotion.achievement_date)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Awarded by: <ProfileName id={promotion.awarded_by_profile_id} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No promotions yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
