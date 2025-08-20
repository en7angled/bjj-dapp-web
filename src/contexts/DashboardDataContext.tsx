'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import type { 
  RankInformation, 
  PromotionInformation, 
  ProfileSummary,
  BeltFrequency,
  TopAcademy
} from '../types/api';

interface GlobalData {
  // Dashboard data
  beltFrequency: BeltFrequency[] | undefined;
  totalBeltsCount: number;
  totalPromotionsCount: number;
  recentPromotions: PromotionInformation[];
  monthlyGrowth: number;
  topAcademies: TopAcademy[] | undefined;
  globalProfilesCount: number;
  activeProfilesCount: number;
  
  // General data that can be used across pages
  allBelts: RankInformation[];
  allPromotions: PromotionInformation[];
  allProfiles: ProfileSummary[];
  
  // Cached data for specific queries
  beltsByProfile: Map<string, RankInformation[]>;
  promotionsByProfile: Map<string, PromotionInformation[]>;
}

interface GlobalDataContextType {
  data: GlobalData | undefined;
  isLoading: boolean;
  error: Error | null;
  
  // Helper functions for getting specific data
  getBeltsForProfile: (profileId: string) => RankInformation[];
  getPromotionsForProfile: (profileId: string) => PromotionInformation[];
  
  // Cache invalidation functions
  invalidateAllData: () => void;
  invalidateProfileData: () => void;
  invalidateBeltData: () => void;
  invalidatePromotionData: () => void;
  refreshData: () => void;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  // Optimized query configuration with different stale times based on data volatility
  const { data: beltFrequency, isLoading: frequencyLoading } = useQuery({
    queryKey: ['belt-frequency'],
    queryFn: () => BeltSystemAPI.getBeltsFrequency(),
    staleTime: 10 * 60 * 1000, // 10 minutes - less volatile
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  });

  const { data: totalBeltsCount, isLoading: totalBeltsLoading } = useQuery({
    queryKey: ['total-belts-count'],
    queryFn: () => BeltSystemAPI.getBeltsCount({}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Background refresh every 2 minutes
  });

  const { data: totalPromotionsCount, isLoading: totalPromotionsLoading } = useQuery({
    queryKey: ['total-promotions-count'],
    queryFn: () => BeltSystemAPI.getPromotionsCount({}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Background refresh every 2 minutes
  });

  const { data: recentPromotions, isLoading: recentPromotionsLoading } = useQuery({
    queryKey: ['recent-promotions'],
    queryFn: () => BeltSystemAPI.getRecentPromotions(30),
    staleTime: 1 * 60 * 1000, // 1 minute - more volatile
    refetchInterval: 30 * 1000, // Background refresh every 30 seconds
  });

  const { data: monthlyGrowth, isLoading: growthLoading } = useQuery({
    queryKey: ['monthly-growth'],
    queryFn: () => BeltSystemAPI.getMonthlyGrowthRate(),
    staleTime: 15 * 60 * 1000, // 15 minutes - less volatile
    refetchInterval: 10 * 60 * 1000, // Background refresh every 10 minutes
  });

  const { data: topAcademies, isLoading: academiesLoading } = useQuery({
    queryKey: ['top-academies'],
    queryFn: () => BeltSystemAPI.getTopPerformingAcademies(5),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 10 * 60 * 1000, // Background refresh every 10 minutes
  });

  const { data: globalProfilesCount, isLoading: profilesCountLoading } = useQuery({
    queryKey: ['global-profiles-count'],
    queryFn: () => BeltSystemAPI.getProfilesCount(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  });

  const { data: activeProfilesCount, isLoading: activeProfilesLoading } = useQuery({
    queryKey: ['active-profiles-count'],
    queryFn: () => BeltSystemAPI.getActiveProfilesCount(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
  });

  // Lazy load larger datasets only when needed
  const { data: allBelts } = useQuery({
    queryKey: ['all-belts'],
    queryFn: () => BeltSystemAPI.getBelts({ limit: 1000, order_by: 'date', order: 'desc' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 3 * 60 * 1000, // Background refresh every 3 minutes
    enabled: false, // Only fetch when explicitly requested
  });

  const { data: allPromotions } = useQuery({
    queryKey: ['all-promotions'],
    queryFn: async () => {
      const promotions = await BeltSystemAPI.getPromotions({ limit: 500, order_by: 'date', order: 'desc' });
      return promotions;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 3 * 60 * 1000, // Background refresh every 3 minutes
    enabled: false, // Only fetch when explicitly requested
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => BeltSystemAPI.getProfiles({ limit: 500 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
    enabled: false, // Only fetch when explicitly requested
  });

  const isLoading = frequencyLoading || totalBeltsLoading || totalPromotionsLoading || 
                   recentPromotionsLoading || growthLoading || academiesLoading || 
                   profilesCountLoading || activeProfilesLoading;

  // Create cached maps for efficient lookups - only when data is available
  const beltsByProfile = new Map<string, RankInformation[]>();
  const promotionsByProfile = new Map<string, PromotionInformation[]>();

  if (allBelts) {
    for (const belt of allBelts) {
      const profileId = belt.achieved_by_profile_id;
      if (!beltsByProfile.has(profileId)) {
        beltsByProfile.set(profileId, []);
      }
      beltsByProfile.get(profileId)!.push(belt);
    }
  }

  if (allPromotions) {
    for (const promotion of allPromotions) {
      const profileId = promotion.achieved_by_profile_id;
      if (!promotionsByProfile.has(profileId)) {
        promotionsByProfile.set(profileId, []);
      }
      promotionsByProfile.get(profileId)!.push(promotion);
    }
  }

  const data: GlobalData | undefined = {
    beltFrequency,
    totalBeltsCount: totalBeltsCount || 0,
    totalPromotionsCount: totalPromotionsCount || 0,
    recentPromotions: recentPromotions || [],
    monthlyGrowth: monthlyGrowth || 0,
    topAcademies,
    globalProfilesCount: globalProfilesCount || 0,
    activeProfilesCount: activeProfilesCount || 0,
    allBelts: allBelts || [],
    allPromotions: allPromotions || [],
    allProfiles: allProfiles || [],
    beltsByProfile,
    promotionsByProfile,
  };

  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Helper functions
  const getBeltsForProfile = (profileId: string): RankInformation[] => {
    return beltsByProfile.get(profileId) || [];
  };

  const getPromotionsForProfile = (profileId: string): PromotionInformation[] => {
    const promotions = promotionsByProfile.get(profileId) || [];
    return promotions;
  };

  // Cache invalidation functions
  const invalidateAllData = () => {
    queryClient.invalidateQueries({ queryKey: ['belt-frequency'] });
    queryClient.invalidateQueries({ queryKey: ['total-belts-count'] });
    queryClient.invalidateQueries({ queryKey: ['total-promotions-count'] });
    queryClient.invalidateQueries({ queryKey: ['recent-promotions'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-growth'] });
    queryClient.invalidateQueries({ queryKey: ['top-academies'] });
    queryClient.invalidateQueries({ queryKey: ['global-profiles-count'] });
    queryClient.invalidateQueries({ queryKey: ['active-profiles-count'] });
    queryClient.invalidateQueries({ queryKey: ['all-belts'] });
    queryClient.invalidateQueries({ queryKey: ['all-promotions'] });
    queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
  };

  const invalidateProfileData = () => {
    queryClient.invalidateQueries({ queryKey: ['global-profiles-count'] });
    queryClient.invalidateQueries({ queryKey: ['active-profiles-count'] });
    queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
  };

  const invalidateBeltData = () => {
    queryClient.invalidateQueries({ queryKey: ['belt-frequency'] });
    queryClient.invalidateQueries({ queryKey: ['total-belts-count'] });
    queryClient.invalidateQueries({ queryKey: ['all-belts'] });
  };

  const invalidatePromotionData = () => {
    queryClient.invalidateQueries({ queryKey: ['total-promotions-count'] });
    queryClient.invalidateQueries({ queryKey: ['recent-promotions'] });
    queryClient.invalidateQueries({ queryKey: ['monthly-growth'] });
    queryClient.invalidateQueries({ queryKey: ['top-academies'] });
    queryClient.invalidateQueries({ queryKey: ['all-promotions'] });
  };

  const refreshData = () => {
    invalidateAllData();
  };

  return (
    <GlobalDataContext.Provider value={{ 
      data, 
      isLoading, 
      error: null,
      getBeltsForProfile,
      getPromotionsForProfile,
      invalidateAllData,
      invalidateProfileData,
      invalidateBeltData,
      invalidatePromotionData,
      refreshData
    }}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
}

// Keep the old name for backward compatibility
export const DashboardDataProvider = GlobalDataProvider;
export const useDashboardData = useGlobalData;
