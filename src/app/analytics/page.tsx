'use client';

import { Navigation } from '../../components/Navigation';
import { BeltDistributionChart } from '../../components/BeltDistributionChart';
import { BeltSystemAPI } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Trophy, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: totalBelts } = useQuery({
    queryKey: ['belts-count'],
    queryFn: () => BeltSystemAPI.getBeltsCount(),
  });

  const { data: totalPromotions } = useQuery({
    queryKey: ['promotions-count'],
    queryFn: () => BeltSystemAPI.getPromotionsCount(),
  });

  const { data: beltFrequency } = useQuery({
    queryKey: ['belts-frequency'],
    queryFn: () => BeltSystemAPI.getBeltsFrequency(),
  });

  const { data: activeProfilesCount } = useQuery({
    queryKey: ['active-profiles-count'],
    queryFn: () => BeltSystemAPI.getActiveProfilesCount(),
  });

  const { data: recentPromotions } = useQuery({
    queryKey: ['recent-promotions'],
    queryFn: () => BeltSystemAPI.getRecentPromotions(30), // Last 30 days
  });

  const { data: topAcademies } = useQuery({
    queryKey: ['top-academies'],
    queryFn: () => BeltSystemAPI.getTopPerformingAcademies(5),
  });

  const { data: monthlyGrowthRate } = useQuery({
    queryKey: ['monthly-growth-rate'],
    queryFn: () => BeltSystemAPI.getMonthlyGrowthRate(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive insights into the BJJ belt system performance and trends
              </p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Belts */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Trophy className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Belts Awarded
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalBelts !== undefined ? totalBelts : '...'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Promotions */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Promotions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {totalPromotions !== undefined ? totalPromotions : '...'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Monthly Growth
                      </dt>
                      <dd className="text-lg font-medium text-green-600">
                        {monthlyGrowthRate !== undefined ? (
                          monthlyGrowthRate >= 0 ? `+${monthlyGrowthRate}%` : `${monthlyGrowthRate}%`
                        ) : '...'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Profiles
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {activeProfilesCount !== undefined ? activeProfilesCount : '...'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
          {/* Belt distribution chart */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Belt Distribution
              </h3>
              <BeltDistributionChart />
            </div>
          </div>

          {/* Additional analytics placeholder */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Promotion Trends
              </h3>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Coming Soon</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Advanced analytics and trend visualization will be available here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional insights */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                System Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Top Performing Academies</h4>
                  <div className="space-y-2">
                                          {topAcademies && topAcademies.length > 0 ? (
                      topAcademies.map((academy) => (
                        <div key={academy.academyId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{academy.academyName}</span>
                          <span className="font-medium">{academy.beltCount} belts</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">Loading academy data...</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {recentPromotions ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">This Week</span>
                          <span className="font-medium">
                            {recentPromotions.filter(p => {
                              const promoDate = new Date(p.achievement_date);
                              const weekAgo = new Date();
                              weekAgo.setDate(weekAgo.getDate() - 7);
                              return promoDate >= weekAgo;
                            }).length} promotions
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">This Month</span>
                          <span className="font-medium">
                            {recentPromotions.filter(p => {
                              const promoDate = new Date(p.achievement_date);
                              const monthAgo = new Date();
                              monthAgo.setMonth(monthAgo.getMonth() - 1);
                              return promoDate >= monthAgo;
                            }).length} promotions
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last 30 Days</span>
                          <span className="font-medium">{recentPromotions.length} promotions</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">Loading activity data...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
