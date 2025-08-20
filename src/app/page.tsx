'use client';

import { Navigation } from '../components/Navigation';
import { RecentBelts } from '../components/RecentBelts';
// Removed bar distribution in favor of the pie chart
import { BeltDistributionPie } from '../components/BeltDistributionPie';
import { RecentPromotions } from '../components/RecentPromotions';
import { TopAwardersChart } from '../components/TopAwardersChart';
import { PromotionsByBeltOverTimeChart } from '../components/PromotionsByBeltOverTimeChart';
import { AverageTimeAtBeltChart } from '../components/AverageTimeAtBeltChart';
import { DashboardDataProvider, useDashboardData } from '../contexts/DashboardDataContext';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Activity, 
  Users, 
  Shield
} from 'lucide-react';

function DashboardContent() {
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

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
                    {data?.totalBeltsCount || 0}
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
                    {data?.totalPromotionsCount || 0}
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
                    {`${data?.monthlyGrowth || 0}%`}
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
                  <p className="text-sm font-medium text-gray-500">Active Profiles</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data?.activeProfilesCount || 0}
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
                  <p className="text-sm font-medium text-gray-500">Total Profiles</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data?.globalProfilesCount || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Academies</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data?.topAcademies?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Belt Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Belt Distribution</h3>
              <BeltDistributionPie />
            </div>

            {/* Recent Promotions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Promotions</h3>
              <RecentPromotions />
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Awarders */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Awarders (Last 90 Days)</h3>
              <TopAwardersChart days={90} limit={8} />
            </div>

            {/* Promotions Over Time */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Promotions by Belt Over Time</h3>
              <PromotionsByBeltOverTimeChart />
            </div>
          </div>
        </div>

        {/* Time at Belt Analysis */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Average Time at Belt</h3>
            <AverageTimeAtBeltChart />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Belts</h3>
            <RecentBelts />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <DashboardDataProvider>
      <DashboardContent />
    </DashboardDataProvider>
  );
}
