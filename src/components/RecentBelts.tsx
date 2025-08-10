'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { BeltBadge } from './BeltDisplay';
import { formatDateShort, truncateAddress } from '../lib/utils';
import { Trophy, User, Award, Calendar } from 'lucide-react';

export function RecentBelts() {
  const { data: belts, isLoading } = useQuery({
    queryKey: ['recent-belts'],
    queryFn: () => BeltSystemAPI.getBelts({ limit: 10 }),
  });

  const items = useMemo(() => {
    const arr = Array.isArray(belts) ? [...belts] : [];
    arr.sort((a, b) => new Date(b.achievement_date).getTime() - new Date(a.achievement_date).getTime());
    return arr.slice(0, 10);
  }, [belts]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No belts</h3>
        <p className="mt-1 text-sm text-gray-500">
          No belts have been awarded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="flow-root">
        <ul className="-my-5 divide-y divide-gray-200">
          {items.map((belt) => (
            <li key={belt.id} className="py-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <BeltBadge belt={belt.belt} />
                    <span className="text-xs text-gray-500">
                      {formatDateShort(belt.achievement_date)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-900 space-y-1">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">Achieved by:</span>
                      <span className="font-mono text-xs">
                        {truncateAddress(belt.achieved_by_profile_id)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Award className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">Awarded by:</span>
                      <span className="font-mono text-xs">
                        {truncateAddress(belt.awarded_by_profile_id)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-500">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatDateShort(belt.achievement_date)}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {items.length >= 10 && (
        <div className="text-center pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all belts →
          </button>
        </div>
      )}
    </div>
  );
}
