'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BeltSystemAPI } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import type { 
  PractitionerProfileInformation, 
  ProfileType 
} from '../types/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: PractitionerProfileInformation | null;
  profileId: string | null;
  profileType: ProfileType | null;
  isLoading: boolean;
  login: (profileId: string, profileType: ProfileType) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<PractitionerProfileInformation>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);

  // Normalize a profile asset id into the dotted form policyId.assetNameHex and
  // adjust known legacy prefixes to their current equivalents.
  function normalizeAssetId(rawId: string): string {
    if (!rawId) return rawId;
    let id = rawId;
    if (!id.includes('.') && id.length > 56) {
      id = `${id.slice(0, 56)}.${id.slice(56)}`;
    }
    const [policy, name] = id.split('.') as [string, string | undefined];
    if (!name) return id;
    const lower = name.toLowerCase();
    let adjusted = lower;
    if (lower.startsWith('000de140')) {
      adjusted = `000643b0${lower.slice(8)}`;
    } else if (lower.startsWith('000de14')) {
      adjusted = `000643b${lower.slice(7)}`;
    }
    return `${policy}.${adjusted}`;
  }

  // Check if user is already authenticated on mount
  useEffect(() => {
    const savedProfileId = localStorage.getItem('bjj-profile-id');
    const savedProfileType = localStorage.getItem('bjj-profile-type') as ProfileType;
    
    if (savedProfileId && savedProfileType) {
      // Normalize to dotted format policyId.assetNameHex if needed
      const normalizedId = savedProfileId.includes('.')
        ? savedProfileId
        : (savedProfileId.length > 56
            ? `${savedProfileId.slice(0, 56)}.${savedProfileId.slice(56)}`
            : savedProfileId);
      if (normalizedId !== savedProfileId) {
        localStorage.setItem('bjj-profile-id', normalizedId);
      }
      setProfileId(normalizedId);
      setProfileType(savedProfileType);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch user profile data when authenticated (use normalized dotted id and adjusted prefix)
  const { data: user = null, isLoading } = useQuery<PractitionerProfileInformation | null>({
    queryKey: ['profile', profileId, profileType],
    queryFn: async () => {
      if (!profileId || !profileType) {
        throw new Error('Missing profile id or type');
      }
      const candidates: string[] = [normalizeAssetId(profileId)];

      let lastErr: unknown = null;
      for (const id of candidates) {
        try {
          const res: PractitionerProfileInformation = await BeltSystemAPI.getPractitionerProfile(id);
          return res as PractitionerProfileInformation;
        } catch (e) {
          lastErr = e;
        }
      }
      // If none of the candidates worked, return null to render "Profile not found" gracefully
      return null;
    },
    enabled: isAuthenticated && !!profileId && !!profileType,
  });

  const login = async (newProfileId: string, newProfileType: ProfileType) => {
    try {
      console.log('AuthContext: Login called with:', { newProfileId, newProfileType });
      
      // In a real app, you would validate credentials here
      // Normalize ID to dotted format and adjust known prefix
      const normalizedId = normalizeAssetId(newProfileId);
      setProfileId(normalizedId);
      setProfileType(newProfileType);
      setIsAuthenticated(true);
      
      // Save to localStorage for persistence
      localStorage.setItem('bjj-profile-id', normalizedId);
      localStorage.setItem('bjj-profile-type', newProfileType);
      
      console.log('AuthContext: Login successful, new state:', { 
        isAuthenticated: true, 
        profileId: normalizedId, 
        profileType: newProfileType 
      });
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logout called');
    
    setIsAuthenticated(false);
    setProfileId(null);
    setProfileType(null);
    
    // Clear localStorage
    localStorage.removeItem('bjj-profile-id');
    localStorage.removeItem('bjj-profile-type');
    try { BeltSystemAPI.clearCaches(); } catch {}
    
    console.log('AuthContext: Logout successful, state cleared');
  };

  const updateProfile = async (profileData: Partial<PractitionerProfileInformation>) => {
    // In a real app, you would make an API call to update the profile
    // For now, we'll just log the update
    console.log('Profile update requested:', profileData);
    
    // You could implement optimistic updates here
    // or wait for the API response and refetch the profile
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    profileId,
    profileType,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
