'use client';

import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { Trophy, Users, TrendingUp, Clock } from 'lucide-react';

export function DashboardStats() {
  const { data: beltsCount, isLoading: beltsLoading } = useQuery({
    queryKey: ['belts-count'],
    queryFn: () => BeltSystemAPI.getBeltsCount(),
  });

  const { data: promotionsCount, isLoading: promotionsLoading } = useQuery({
    queryKey: ['promotions-count'],
    queryFn: () => BeltSystemAPI.getPromotionsCount(),
  });

  const { data: beltsFrequency, isLoading: frequencyLoading } = useQuery({
    queryKey: ['belts-frequency'],
    queryFn: () => BeltSystemAPI.getBeltsFrequency(),
  });

  const stats = [
    {
      name: 'Total Belts',
      value: beltsLoading ? '...' : beltsCount?.toLocaleString() || '0',
      icon: Trophy,
      description: 'Belts awarded across the network',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      name: 'Pending Promotions',
      value: promotionsLoading ? '...' : promotionsCount?.toLocaleString() || '0',
      icon: Clock,
      description: 'Promotions awaiting approval',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      name: 'Active Profiles',
      value: frequencyLoading ? '...' : beltsFrequency?.length?.toString() || '0',
      icon: Users,
      description: 'Active practitioner profiles',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      name: 'Growth Rate',
      value: '23%',
      icon: TrendingUp,
      description: 'Monthly growth in new belts',
      change: '+2.5%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => (
        <div
          key={item.name}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {item.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{item.description}</span>
                <span
                  className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.changeType === 'positive'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
