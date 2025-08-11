'use client';

import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { BeltBadge } from './BeltDisplay';
import { formatDateShort } from '../lib/utils';
import { Clock, User, Award } from 'lucide-react';
import { ProfileName } from './ProfileName';
import { useMemo } from 'react';

export function RecentPromotions() {
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['recent-promotions'],
    queryFn: () => BeltSystemAPI.getPromotions({ limit: 5 }),
  });


  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No promotions</h3>
        <p className="mt-1 text-sm text-gray-500">
          No pending promotions at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {promotions.map((promotion) => (
        <div
          key={promotion.id}
          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <BeltBadge belt={promotion.belt} />
              <span className="text-xs text-gray-500">
                {formatDateShort(promotion.achievement_date)}
              </span>
            </div>
            
            <div className="text-sm text-gray-900 space-y-1">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-gray-400" />
                <span className="font-medium">Achieved by:</span>
                <ProfileName id={promotion.achieved_by_profile_id} className="font-mono text-xs" />
              </div>
              
              <div className="flex items-center space-x-1">
                <Award className="w-3 h-3 text-gray-400" />
                <span className="font-medium">Awarded by:</span>
                <ProfileName id={promotion.awarded_by_profile_id} className="font-mono text-xs" />
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {promotions.length >= 5 && (
        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all promotions →
          </button>
        </div>
      )}
    </div>
  );
}
