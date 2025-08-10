'use client';

import { Navigation } from '../components/Navigation';
import { DashboardStats } from '../components/DashboardStats';
import { RecentBelts } from '../components/RecentBelts';
import { BeltDistributionChart } from '../components/BeltDistributionChart';
import { RecentPromotions } from '../components/RecentPromotions';
import { APITest } from '../components/APITest';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to the Decentralized BJJ Belt System. Monitor belts, profiles, and promotions across the network.
          </p>
        </div>

        {/* Stats */}
        <div className="px-4 sm:px-0 mb-8">
          <DashboardStats />
        </div>

        {/* Charts and recent activity */}
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

          {/* Recent promotions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Promotions
              </h3>
              <RecentPromotions />
            </div>
          </div>
        </div>

        {/* Recent belts */}
        <div className="mt-8 px-4 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Belt Achievements
              </h3>
              <RecentBelts />
            </div>
          </div>
        </div>

        {/* API Connection Test */}
        <div className="mt-8 px-4 sm:px-0">
          <APITest />
        </div>
      </main>
    </div>
  );
}
