'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BeltSystemAPI } from '../lib/api';
import { Search, X, User } from 'lucide-react';
import { ProfileSummary } from '../types/api';

interface ProfileSearchProps {
  value: string[];
  onChange: (profileIds: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function ProfileSearch({ 
  value, 
  onChange, 
  placeholder = "Search profiles by name...", 
  label = "Profile",
  className = "" 
}: ProfileSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileSummary[]>([]);

  // Fetch profiles based on search term
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['profile-search', searchTerm],
    queryFn: () => BeltSystemAPI.getProfiles({ 
      name: searchTerm, 
      limit: 20,
      order_by: 'name',
      order: 'asc'
    }),
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load selected profile details when value changes
  useEffect(() => {
    const loadSelectedProfiles = async () => {
      if (value.length === 0) {
        setSelectedProfiles([]);
        return;
      }

      const profiles: ProfileSummary[] = [];
      for (const profileId of value) {
        try {
          // Try to get profile details
          const profile = await BeltSystemAPI.getPractitionerProfile(profileId);
          if (profile) {
            profiles.push(profile);
          }
        } catch {
          // If practitioner profile fails, create a fallback profile object
          profiles.push({
            id: profileId,
            name: profileId.slice(0, 12) + '...',
            description: 'Profile not found',
            type: 'Practitioner'
          });
        }
      }
      setSelectedProfiles(profiles);
    };

    loadSelectedProfiles();
  }, [value]);

  const handleSelectProfile = (profile: ProfileSummary) => {
    if (!value.includes(profile.id)) {
      const newValue = [...value, profile.id];
      onChange(newValue);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveProfile = (profileId: string) => {
    const newValue = value.filter(id => id !== profileId);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      {/* Selected profiles */}
      {selectedProfiles.length > 0 && (
        <div className="mb-2 space-y-1">
          {selectedProfiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{profile.name}</span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {profile.type}
                </span>
              </div>
              <button
                onClick={() => handleRemoveProfile(profile.id)}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Dropdown results */}
      {isOpen && searchTerm.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{profile.name}</div>
                      <div className="text-xs text-gray-500">{profile.type}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="px-4 py-2 text-sm text-gray-500">No profiles found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
