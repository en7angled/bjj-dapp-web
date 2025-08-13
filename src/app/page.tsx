'use client';

import { Navigation } from '../components/Navigation';
import { RecentBelts } from '../components/RecentBelts';
// Removed bar distribution in favor of the pie chart
import { BeltDistributionPie } from '../components/BeltDistributionPie';
import { RecentPromotions } from '../components/RecentPromotions';
import { TopAwardersChart } from '../components/TopAwardersChart';
import { PromotionsByBeltOverTimeChart } from '../components/PromotionsByBeltOverTimeChart';
import { AverageTimeAtBeltChart } from '../components/AverageTimeAtBeltChart';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Activity, 
  Users, 
  Shield, 
  BarChart3,
  Building2,
  Hash,
  Calendar
} from 'lucide-react';

export default function Home() {

  // Fetch global/community data
  const { data: beltFrequency, isLoading: frequencyLoading } = useQuery({
    queryKey: ['belt-frequency'],
    queryFn: () => BeltSystemAPI.getBeltsFrequency(),
  });

  const { data: recentPromotions, isLoading: recentPromotionsLoading } = useQuery({
    queryKey: ['recent-promotions'],
    queryFn: () => BeltSystemAPI.getRecentPromotions(30),
  });

  const { data: monthlyGrowth, isLoading: growthLoading } = useQuery({
    queryKey: ['monthly-growth'],
    queryFn: () => BeltSystemAPI.getMonthlyGrowthRate(),
  });

  const { data: topAcademies, isLoading: academiesLoading } = useQuery({
    queryKey: ['top-academies'],
    queryFn: () => BeltSystemAPI.getTopPerformingAcademies(5),
  });

  const { data: globalProfilesCount, isLoading: profilesCountLoading } = useQuery({
    queryKey: ['global-profiles-count'],
    queryFn: () => BeltSystemAPI.getProfilesCount(),
  });

  const { data: activeProfilesCount, isLoading: activeProfilesLoading } = useQuery({
    queryKey: ['active-profiles-count'],
    queryFn: () => BeltSystemAPI.getActiveProfilesCount(),
  });

  const { data: totalBeltsCount, isLoading: totalBeltsLoading } = useQuery({
    queryKey: ['total-belts-count'],
    queryFn: () => BeltSystemAPI.getBeltsCount({}),
  });

  const { data: totalPromotionsCount, isLoading: totalPromotionsLoading } = useQuery({
    queryKey: ['total-promotions-count'],
    queryFn: () => BeltSystemAPI.getPromotionsCount({}),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Community Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to the Decentralized BJJ Belt System. Monitor belts, profiles, and promotions across the network.
          </p>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Trophy className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Belts</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalBeltsLoading ? '...' : totalBeltsCount || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Promotions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {totalPromotionsLoading ? '...' : totalPromotionsCount || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Monthly Growth</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {growthLoading ? '...' : `${monthlyGrowth || 0}%`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Recent Activity</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {recentPromotionsLoading ? '...' : recentPromotions?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Global Profiles</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {profilesCountLoading ? '...' : globalProfilesCount || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Profiles</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {activeProfilesLoading ? '...' : activeProfilesCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 sm:px-0">
          {/* Belt distribution pie */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Practitioner Distribution by Belt
              </h3>
              <BeltDistributionPie />
            </div>
          </div>

          {/* Recent promotions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Community Promotions
              </h3>
              <RecentPromotions />
            </div>
          </div>

          {/* Top awarders */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Top Awarders (Last 90 Days)
              </h3>
              <TopAwardersChart days={90} />
            </div>
          </div>

          {/* Promotions by belt over time */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Promotions by Belt Over Time (Last 12 Months)
              </h3>
              <PromotionsByBeltOverTimeChart months={12} />
            </div>
          </div>
        </div>

        {/* Average time at belt */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Average Time at Each Belt (months)
              </h3>
              <AverageTimeAtBeltChart />
            </div>
          </div>
        </div>

        {/* Top Performing Academies */}
        {!academiesLoading && topAcademies && topAcademies.length > 0 && (
          <div className="mt-8 px-4 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                  Top Performing Academies
                </h3>
                <div className="space-y-3">
                  {topAcademies.map((academy, index) => (
                    <div key={academy.academyId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-gray-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{academy.academyName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hash className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{academy.beltCount} belts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent belts */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                Recent Belt Achievements
              </h3>
              <RecentBelts />
            </div>
          </div>
        </div>

        {/* API Connection Test */}
        <div className="mt-8 px-4 sm:px-0">
          {/* API test removed */}
        </div>
      </main>
    </div>
  );
}
