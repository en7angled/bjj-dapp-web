'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Navigation } from '../../components/Navigation';
import { LoginModal } from '../../components/LoginModal';
import { BeltSystemAPI } from '../../lib/api';
import { useQuery } from '@tanstack/react-query';
import { useGlobalData } from '../../contexts/DashboardDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Trophy, 
  Shield, 
  Edit3, 
  Calendar, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ChevronRight, 
  LogOut, 
  Copy, 
  Check 
} from 'lucide-react';
import { AwardBeltModal } from '../../components/AwardBeltModal';
import { WalletSelector } from '../../components/WalletSelector';
import { useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '../../config/api';
import type { 
  BJJBelt
} from '../../types/api';

// Dynamic imports for heavy Cardano libraries
const loadCardanoLibraries = async () => {
  const [BrowserWallet, { deserializeAddress }, { Address, Transaction, TransactionWitnessSet }] = await Promise.all([
    import('@meshsdk/core').then(m => m.BrowserWallet),
    import('@meshsdk/core').then(m => ({ deserializeAddress: m.deserializeAddress })),
    import('@emurgo/cardano-serialization-lib-browser').then(m => ({ 
      Address: m.Address, 
      Transaction: m.Transaction, 
      TransactionWitnessSet: m.TransactionWitnessSet 
    }))
  ]);
  return { BrowserWallet, deserializeAddress, Address, Transaction, TransactionWitnessSet };
};

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'signin' | 'create'>('signin');
  const [wallet, setWallet] = useState<any>(null);
  const [prefillUsed, setPrefillUsed] = useState<string[] | undefined>(undefined);
  const [prefillChange, setPrefillChange] = useState<string | undefined>(undefined);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [copiedProfileId, setCopiedProfileId] = useState(false);
  const queryClient = useQueryClient();

  // Handle wallet selection using the common selector
  async function handleWalletSelect(connected: any) {
    try {
      setWalletError(null);
      // Basic network validation
      const nid = await connected.getNetworkId();
      if (nid !== API_CONFIG.NETWORK_ID) {
        throw new Error('Wallet network mismatch.');
      }
      setWallet(connected);
      // Prefill addresses for login/create flows
      try {
        const used = await connected.getUsedAddresses();
        const change = await connected.getChangeAddress();
        setPrefillUsed(used);
        setPrefillChange(change);
      } catch {}
    } catch (e: any) {
      setWalletError(e?.message || 'Failed to connect wallet');
    }
  }
  const modalRef = useRef<HTMLDivElement>(null);
  const modalStateRef = useRef({ showAuthModal, loginMode });
  const [forceRender, setForceRender] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Update ref when state changes
  modalStateRef.current = { showAuthModal, loginMode };
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    description: '',
    imageUri: '',
    belt: 'White' as BJJBelt,
    profileType: 'Practitioner' as 'Practitioner' | 'Organization'
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'building' | 'ready' | 'submitting' | 'success' | 'error'>('idle');
  const { 
    isAuthenticated, 
    user: profile, 
    profileId, 
    isLoading: profileLoading, 
    login, 
    logout 
  } = useAuth();

  const normalizedProfileId = useMemo(() => normalizeAssetId(profileId || null), [profileId]);



  // Copy profile ID to clipboard
  async function copyProfileIdToClipboard() {
    if (!normalizedProfileId) return;
    try {
      await navigator.clipboard.writeText(normalizedProfileId);
      setCopiedProfileId(true);
      setTimeout(() => setCopiedProfileId(false), 2000);
    } catch {
      // ignore
    }
  }

  // Normalize an asset id to dotted format and adjust known prefix if required
  function normalizeAssetId(rawId: string | undefined | null): string | null {
    if (!rawId) return null;
    let id = rawId;
    if (!id.includes('.') && id.length > 56) {
      id = `${id.slice(0, 56)}.${id.slice(56)}`;
    }
    const parts = id.split('.');
    if (parts.length !== 2) return id;
    const [policy, name] = parts;
    const lower = (name || '').toLowerCase();
    let adjusted = lower;
    if (lower.startsWith('000de14')) {
      adjusted = `000643b${lower.slice(7)}`;
    }
    return `${policy}.${adjusted}`;
  }

  const isMockProfile = Boolean(profileId && (profileId.startsWith('mock-') || profileId.startsWith('user-') || profileId.startsWith('new-user-')));

  // Persist modal state across re-renders
  useEffect(() => {
    if (showAuthModal && modalRef.current) {
      // Ensure modal is visible and focused
      modalRef.current.focus();
  
    }
  }, [showAuthModal]);

  // Sync modalVisible with showAuthModal
  useEffect(() => {
    setModalVisible(showAuthModal);
  }, [showAuthModal]);

  // Debug modal state changes
  useEffect(() => {

  }, [showAuthModal, modalVisible, forceRender]);

  // Prefer belts from practitioner profile (authoritative)
  const beltsFromProfile = useMemo(() => {
    if (profile && 'current_rank' in profile) {
      const previous = Array.isArray(profile.previous_ranks) ? profile.previous_ranks : [];
      const combined = [...previous, profile.current_rank];
      combined.sort((a, b) => new Date(a.achievement_date).getTime() - new Date(b.achievement_date).getTime());
      return combined;
    }
    return [] as typeof filteredUserBelts;
  }, [profile]);

  // Use global data provider for all data
  const { 
    getBeltsForProfile, 
    getPromotionsForProfile, 
    invalidateBeltData, 
    invalidatePromotionData, 
    invalidateProfileData 
  } = useGlobalData();
  
  const userBeltsFallback = getBeltsForProfile(normalizedProfileId || '');
  
  const filteredUserBelts = useMemo(() => {
    return userBeltsFallback.filter(b => b.achieved_by_profile_id === normalizedProfileId);
  }, [userBeltsFallback, normalizedProfileId]);

  const displayedBelts = beltsFromProfile.length > 0 ? beltsFromProfile : filteredUserBelts;

  // Resolve awarder profile names (practitioner) for display
  const uniqueAwarders = useMemo(() => {
    const ids = new Set<string>();
    for (const b of displayedBelts) {
      if (b?.awarded_by_profile_id) ids.add(b.awarded_by_profile_id);
    }
    return Array.from(ids);
  }, [displayedBelts]);

  const { data: awarderNameMap } = useQuery({
    queryKey: ['awarder-names', uniqueAwarders],
    queryFn: async () => {
      const entries: Array<[string, string]> = [];
      for (const id of uniqueAwarders) {
        const name = await BeltSystemAPI.resolveProfileName(normalizeAssetId(id)!);
        entries.push([id, name]);
      }
      return Object.fromEntries(entries) as Record<string, string>;
    },
    enabled: uniqueAwarders.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  function resolveAwarderName(awarderId: string | undefined): string {
    if (!awarderId) return '';
    const selfId = normalizeAssetId(profileId);
    const normalizedAwarder = normalizeAssetId(awarderId);
    if (selfId && normalizedAwarder && selfId === normalizedAwarder) {
      return 'You';
    }
    return awarderNameMap?.[awarderId] || awarderId;
  }

  // Professor/Lineage: the practitioner who awarded the latest belt
  const latestBelt = useMemo(() => (displayedBelts.length > 0 ? displayedBelts[displayedBelts.length - 1] : null), [displayedBelts]);
  const professorId = useMemo(() => normalizeAssetId(latestBelt?.awarded_by_profile_id || ''), [latestBelt]);
  const { data: professorProfile } = useQuery({
    queryKey: ['professor-profile', professorId],
    queryFn: () => BeltSystemAPI.getPractitionerProfile(professorId!),
    enabled: isAuthenticated && !!professorId && !isMockProfile,
  });



  // Use global data provider for promotions
  const allUserPromotions = getPromotionsForProfile(profileId || '');
  const promotionsLoading = false; // No loading state needed when using cached data

  const ownPendingPromotions = useMemo(() => {
    // Show all promotions where the current user is the recipient (achieved_by_profile_id)
    const filtered = (allUserPromotions || []).filter(p => p.achieved_by_profile_id === normalizedProfileId);
    return filtered;
  }, [allUserPromotions, normalizedProfileId]);

  function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function toHex114(addr: string): Promise<string | null> {
    const t = (addr || '').trim();
    if (!t) return null;
    if (/^[0-9a-fA-F]+$/.test(t)) return t.length === 114 ? t : null;
    try {
      const { deserializeAddress, Address } = await loadCardanoLibraries();
      const parsed: any = deserializeAddress(t);
      const hex = bytesToHex(parsed.address.to_bytes());
      return hex.length === 114 ? hex : null;
    } catch {
      try {
        const { Address } = await loadCardanoLibraries();
        const a = Address.from_bech32(t);
        const hex = bytesToHex(a.to_bytes());
        return hex.length === 114 ? hex : null;
      } catch {
        return null;
      }
    }
  }

  async function ensureWalletConnected(): Promise<any> {
    if (wallet) return wallet;
    throw new Error('Please select a wallet first');
  }

  async function handleAcceptPromotion(promotionId: string) {
    try {
      setAcceptingId(promotionId);
      setWalletError(null);
      const w = await ensureWalletConnected();
      const nid = await w.getNetworkId();
      if (nid !== API_CONFIG.NETWORK_ID) throw new Error('Wallet network mismatch.');
      const used = await w.getUsedAddresses();
      const change = await w.getChangeAddress();
      const usedHex = Array.from(new Set((await Promise.all(used.map((addr: string) => toHex114(addr)))).filter(Boolean) as string[]));
      const changeHex = await toHex114(change);
      if (!changeHex) throw new Error('Invalid change address');
      if (usedHex.length === 0) usedHex.push(changeHex);
      if (!usedHex.includes(changeHex)) usedHex.push(changeHex);

      const interaction = {
        action: {
          tag: 'AcceptPromotionAction',
          promotion_id: promotionId,
        },
        userAddresses: {
          usedAddresses: usedHex,
          changeAddress: changeHex,
        },
        recipient: changeHex,
      } as const;

      const unsigned = await BeltSystemAPI.buildTransaction(interaction as any);
      let signed = await w.signTx(unsigned, true);
      // Ensure witness set
      try {
        const { TransactionWitnessSet } = await loadCardanoLibraries();
        TransactionWitnessSet.from_bytes(Buffer.from(signed, 'hex'));
      } catch {
        const { Transaction } = await loadCardanoLibraries();
        const tx = Transaction.from_bytes(Buffer.from(signed, 'hex'));
        const ws = tx.witness_set();
        signed = Buffer.from(ws.to_bytes()).toString('hex');
      }
      const res = await BeltSystemAPI.submitTransaction({ tx_unsigned: unsigned, tx_wit: signed });
      setLastTxId(res.id);
      // Invalidate relevant data to refresh across all pages
      invalidateBeltData();
      invalidatePromotionData();
    } catch (e: any) {
      setWalletError(e?.message || 'Failed to accept promotion');
    } finally {
      setAcceptingId(null);
    }
  }



  // Removed organization profile query as requested



  const handleLogout = () => {
    logout();
    // Force clear localStorage as well to ensure complete logout
    localStorage.removeItem('bjj-profile-id');
    localStorage.removeItem('bjj-profile-type');
  };

  // Removed in-auth profile creation flow (moved to login modal)

  const getBeltColor = (belt: BJJBelt) => {
    const colors: Record<BJJBelt, string> = {
      'White': 'bg-white border-gray-300 text-gray-800',
      'Blue': 'bg-blue-500 text-white',
      'Purple': 'bg-purple-500 text-white',
      'Brown': 'bg-amber-700 text-white',
      'Black': 'bg-black text-white',
      'Black1': 'bg-black text-white',
      'Black2': 'bg-black text-white',
      'Black3': 'bg-black text-white',
      'Black4': 'bg-black text-white',
      'Black5': 'bg-black text-white',
      'Black6': 'bg-black text-white',
      'RedAndBlack': 'bg-red-800 text-white',
      'RedAndWhite': 'bg-red-600 text-white',
      'Red': 'bg-red-500 text-white',
      'Red10': 'bg-red-900 text-white',
    };
    return colors[belt] || 'bg-gray-500 text-white';
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setModalVisible(false);
    modalStateRef.current.showAuthModal = false;
    setAuthForm({ email: '', password: '', name: '', description: '', imageUri: '', belt: 'White', profileType: 'Practitioner' });
    setTransactionStatus('idle');
    setForceRender(prev => prev + 1);
  };

  // Metadata: load and allow editing
  const { data: profileMeta } = useQuery({
    queryKey: ['profile-metadata', normalizedProfileId],
    queryFn: () => BeltSystemAPI.getProfileMetadata(normalizedProfileId!),
    enabled: isAuthenticated && !!normalizedProfileId,
  });

  const [metaDraft, setMetaDraft] = useState<{ location?: string; phone?: string; email?: string; website?: string; image_url?: string; birth_date?: string; gender?: string }>({});
  useEffect(() => {
    setMetaDraft({
      location: (profileMeta as any)?.location || undefined,
      phone: (profileMeta as any)?.phone || undefined,
      email: (profileMeta as any)?.email || undefined,
      website: (profileMeta as any)?.website || undefined,
      image_url: (profileMeta as any)?.image_url || undefined,
      birth_date: (profileMeta as any)?.birth_date || undefined,
      gender: (profileMeta as any)?.gender || undefined,
    });
  }, [profileMeta]);

  async function saveMetadata() {
    await BeltSystemAPI.putProfileMetadata({ profile_id: normalizedProfileId!, ...metaDraft });
    // refresh cached metadata and exit edit mode
    queryClient.invalidateQueries({ queryKey: ['profile-metadata', normalizedProfileId] });
    setIsEditing(false);
  }

  async function syncImageOnChain() {
    try {
      if (!metaDraft.image_url) throw new Error('No image to sync');
      setWalletError(null);
      const w = await ensureWalletConnected();
      const nid = await w.getNetworkId();
      if (nid !== API_CONFIG.NETWORK_ID) throw new Error('Wallet network mismatch.');
      const used = await w.getUsedAddresses();
      const change = await w.getChangeAddress();
      const usedHex = Array.from(new Set((await Promise.all(used.map((addr: string) => toHex114(addr)))).filter(Boolean) as string[]));
      const changeHex = await toHex114(change);
      if (!changeHex) throw new Error('Invalid change address');
      if (usedHex.length === 0) usedHex.push(changeHex);
      if (!usedHex.includes(changeHex)) usedHex.push(changeHex);

      const absoluteUrl = metaDraft.image_url.startsWith('http') ? metaDraft.image_url : `${window.location.origin}${metaDraft.image_url}`;
      const interaction = {
        action: {
          tag: 'UpdateProfileImageAction',
          profile_id: normalizeAssetId(profileId!)!,
          image_uri: absoluteUrl,
        },
        userAddresses: {
          usedAddresses: usedHex,
          changeAddress: changeHex,
        },
        recipient: changeHex,
      } as const;

      const unsigned = await BeltSystemAPI.buildTransaction(interaction as any);
      let signed = await w.signTx(unsigned, true);
      try {
        const { TransactionWitnessSet } = await loadCardanoLibraries();
        TransactionWitnessSet.from_bytes(Buffer.from(signed, 'hex'));
      } catch {
        const { Transaction } = await loadCardanoLibraries();
        const tx = Transaction.from_bytes(Buffer.from(signed, 'hex'));
        const ws = tx.witness_set();
        signed = Buffer.from(ws.to_bytes()).toString('hex');
      }
      const res = await BeltSystemAPI.submitTransaction({ tx_unsigned: unsigned, tx_wit: signed });
      setLastTxId(res.id);
      // Invalidate profile data to refresh across all pages
      invalidateProfileData();
    } catch (e: any) {
      setWalletError(e?.message || 'Failed to sync image on-chain');
    }
  }

  function toAbsoluteUrl(maybeRelative?: string): string | null {
    if (!maybeRelative) return null;
    if (/^https?:\/\//i.test(maybeRelative)) return maybeRelative;
    if (typeof window === 'undefined') return null;
    return `${window.location.origin}${maybeRelative}`;
  }

  const isImageSynced = useMemo(() => {
    try {
      const dbRel = metaDraft.image_url;
      const dbAbs = toAbsoluteUrl(dbRel) || dbRel || null;
      const chainUri = (profile && (profile as any).image_uri) ? String((profile as any).image_uri) : null;
      if (!dbAbs || !chainUri) return false;
      if (chainUri === dbAbs || chainUri === dbRel) return true;
      // fallback: allow matching by pathname suffix
      try {
        const rel = dbRel?.startsWith('/') ? dbRel : new URL(dbAbs).pathname;
        return rel ? chainUri.endsWith(rel) : false;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }, [metaDraft.image_url, profile]);

  function cancelEdit() {
    setMetaDraft({
      location: (profileMeta as any)?.location || undefined,
      phone: (profileMeta as any)?.phone || undefined,
      email: (profileMeta as any)?.email || undefined,
      website: (profileMeta as any)?.website || undefined,
      birth_date: (profileMeta as any)?.birth_date || undefined,
      gender: (profileMeta as any)?.gender || undefined,
    });
    setIsEditing(false);
  }

  if (!isAuthenticated) {

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect your wallet</h2>
                <p className="text-gray-600 mb-8">Connect a CIP-30 wallet to sign in. If no profile exists for your wallet, you can create one.</p>
                
                <div className="space-y-3">
                  <WalletSelector
                    onWalletSelect={async (connected) => {
                      await handleWalletSelect(connected);
                      try {
                        // After selecting a wallet, attempt automatic profile detection
                        const assets = await connected.getAssets();
                        const policy = API_CONFIG.PROFILE_POLICY_ID;
                        let foundProfileId: string | null = null;
                        let foundType: 'Practitioner' | 'Organization' = 'Practitioner';
                        if (policy) {
                          const candidates: string[] = [];
                          const seen = new Set<string>();
                          const adjustAssetNameHex = (hex: string): string => {
                            const lower = (hex || '').toLowerCase();
                            if (lower.startsWith('000de14')) {
                              return `000643b${lower.slice(7)}`;
                            }
                            return lower;
                          };
                          for (const a of assets) {
                            const unit: string | undefined = (a as any)?.unit;
                            if (!unit) continue;
                            if (unit.startsWith(policy)) {
                              const assetNameHex = unit.slice(policy.length);
                              const original = `${policy}.${assetNameHex}`;
                              const adjusted = `${policy}.${adjustAssetNameHex(assetNameHex)}`;
                              if (adjusted !== original) {
                                if (!seen.has(adjusted)) { candidates.push(adjusted); seen.add(adjusted); }
                                if (!seen.has(original)) { candidates.push(original); seen.add(original); }
                              } else {
                                if (!seen.has(original)) { candidates.push(original); seen.add(original); }
                              }
                            }
                          }
                          for (const id of candidates) {
                            try {
                              const pr = await fetch(`/api/practitioner/${encodeURIComponent(id)}`);
                              if (pr.ok) { foundProfileId = id; foundType = 'Practitioner'; break; }
                            } catch {}
                            try {
                              const org = await fetch(`/api/organization/${encodeURIComponent(id)}`);
                              if (org.ok) { foundProfileId = id; foundType = 'Organization'; break; }
                            } catch {}
                          }
                        }
                        if (foundProfileId) {
                          await login(foundProfileId, foundType);
                          return;
                        }
                      } catch (e) {
                        console.warn('Asset lookup failed, falling back to create flow', e);
                      }
                      // No profile asset found; open create flow
                      setLoginMode('create');
                      setShowAuthModal(true);
                      setModalVisible(true);
                    }}
                    onError={(err) => setWalletError(err)}
                  />
                </div>
                
                {walletError && (
                  <p className="mt-3 text-sm text-red-600">{walletError}</p>
                )}

                <LoginModal
                  isOpen={Boolean(modalVisible || showAuthModal || modalStateRef.current.showAuthModal)}
                  onClose={closeAuthModal}
                  mode={loginMode}
                  onModeChange={setLoginMode}
                  initialUsedAddresses={prefillUsed}
                  initialChangeAddress={prefillChange}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Unable to load your profile information.
            </p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your profile and view your BJJ journey
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Only show Award Belt button for non-white belts */}
              {profile && 'current_rank' in profile && profile.current_rank && profile.current_rank.belt !== 'White' && (
                <button
                  onClick={() => setShowAwardModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Award Belt
                </button>
              )}

              {/* Persistent Wallet Selector */}
              <div className="w-56">
                <WalletSelector
                  onWalletSelect={async (connected) => {
                    await handleWalletSelect(connected);
                  }}
                  onError={(err) => setWalletError(err)}
                />
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-0">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 overflow-hidden">
                    {metaDraft.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={metaDraft.image_url} alt="Profile" className="w-24 h-24 object-cover" />
                    ) : (
                    <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <label className="text-xs text-gray-600" htmlFor="avatarUpload">Upload image</label>
                      <input id="avatarUpload" type="file" accept="image/*" className="text-xs" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const { image_url } = await BeltSystemAPI.uploadProfileImage(profileId!, file);
                          setMetaDraft(v => ({ ...v, image_url }));
                        } catch (err) {
                          console.error('Image upload failed', err);
                        }
                      }} />
                    </div>
                  )}
                  {!isEditing && Boolean((profileMeta as any)?.image_url) && (
                    <div className="flex items-center justify-center mb-2">
                      {isImageSynced ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-green-600 text-white text-xs">Image synced</span>
                      ) : (
                        <button
                          type="button"
                          onClick={syncImageOnChain}
                          className="inline-flex items-center px-2.5 py-1 rounded bg-orange-500 text-white text-xs hover:bg-orange-600"
                        >
                          Sync image on-chain
                        </button>
                      )}
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                  <p className="text-sm text-gray-500">{profile.description}</p>
                  
                  {/* Profile ID with Copy Button */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Profile ID</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                          {normalizedProfileId}
                        </p>
                      </div>
                      <button
                        onClick={copyProfileIdToClipboard}
                        className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        title="Copy Profile ID"
                      >
                        {copiedProfileId ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Rank */}
                {profile && 'current_rank' in profile && profile.current_rank && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Current Rank</h4>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBeltColor(profile.current_rank.belt)}`}>
                        {profile.current_rank.belt}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(profile.current_rank.achievement_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Profile Details */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input value={metaDraft.location || ''} onChange={(e)=> setMetaDraft(v=>({...v, location: e.target.value}))} placeholder="Location" className="text-sm text-gray-900 border rounded px-2 py-1" />
                    ) : (
                      <span className="text-sm text-gray-600">Location: {metaDraft.location || 'Not specified'}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input value={metaDraft.phone || ''} onChange={(e)=> setMetaDraft(v=>({...v, phone: e.target.value}))} placeholder="Phone" className="text-sm text-gray-900 border rounded px-2 py-1" />
                    ) : (
                      <span className="text-sm text-gray-600">Phone: {metaDraft.phone || 'Not specified'}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input value={metaDraft.email || ''} onChange={(e)=> setMetaDraft(v=>({...v, email: e.target.value}))} placeholder="Email" className="text-sm text-gray-900 border rounded px-2 py-1" />
                    ) : (
                      <span className="text-sm text-gray-600">Email: {metaDraft.email || 'Not specified'}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input value={metaDraft.website || ''} onChange={(e)=> setMetaDraft(v=>({...v, website: e.target.value}))} placeholder="Website" className="text-sm text-gray-900 border rounded px-2 py-1" />
                    ) : (
                      <span className="text-sm text-gray-600">Website: {metaDraft.website || 'Not specified'}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <input 
                        type="date" 
                        value={metaDraft.birth_date || ''} 
                        onChange={(e)=> setMetaDraft(v=>({...v, birth_date: e.target.value}))} 
                        className="text-sm text-gray-900 border rounded px-2 py-1" 
                      />
                    ) : (
                      <span className="text-sm text-gray-600">
                        Birth Date: {metaDraft.birth_date ? new Date(metaDraft.birth_date).toLocaleDateString() : 'Not specified'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    {isEditing ? (
                      <select 
                        value={metaDraft.gender || ''} 
                        onChange={(e)=> setMetaDraft(v=>({...v, gender: e.target.value}))} 
                        className="text-sm text-gray-900 border rounded px-2 py-1"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Gender: {metaDraft.gender ? metaDraft.gender.charAt(0).toUpperCase() + metaDraft.gender.slice(1) : 'Not specified'}
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={saveMetadata} className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Save</button>
                      <button onClick={cancelEdit} className="inline-flex items-center px-3 py-1 rounded border text-sm text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Belt Progression & Lineage */}
          <div className="lg:col-span-2 space-y-6">
            {/* Belt Progression */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Belt Progression</h3>
                
                {false ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : displayedBelts && displayedBelts.length > 0 ? (
                  <div className="space-y-4">
                    {displayedBelts.map((belt, index) => (
                      <div key={belt.id} className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBeltColor(belt.belt)}`}>
                              {belt.belt}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(belt.achievement_date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Awarded by: {resolveAwarderName(belt.awarded_by_profile_id)}
                          </p>
                        </div>
                        
                        {index < displayedBelts.length - 1 && (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No belts yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your belt progression will appear here once you start training.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lineage & Academy Information */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lineage & Academy</h3>
                
                <div className="space-y-4">
                  {/* Academy Information - Removed organization profile display */}
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Professor</h4>
                      <p className="text-sm text-gray-600">
                        {professorProfile?.name || resolveAwarderName(professorId || undefined) || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Academy</h4>
                      <p className="text-sm text-gray-600">
                        Not specified
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Association</h4>
                      <p className="text-sm text-gray-600">Not specified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Promotions (accept/reject) */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Promotions</h3>
                {promotionsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : ownPendingPromotions && ownPendingPromotions.length > 0 ? (
                  <div className="space-y-3">
                    {ownPendingPromotions.map((promotion) => (
                      <div key={promotion.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-3">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{promotion.belt}</span>
                          <span className="ml-2 text-gray-500">{new Date(promotion.achievement_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptPromotion(promotion.id)} disabled={acceptingId === promotion.id} className="px-3 py-1 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">{acceptingId === promotion.id ? 'Accepting...' : 'Accept'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No pending promotions</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Creation removed when authenticated */}
          </div>
        </div>

        {/* Profile Creation Modal removed when authenticated */}

        {/* Authentication Modal removed; using LoginModal component in unauthenticated view */}
      </main>
      {showAwardModal && (
        <AwardBeltModal
          isOpen={showAwardModal}
          onClose={() => setShowAwardModal(false)}
          promotedByProfileId={profileId!}
          currentUserBelt={(profile && 'current_rank' in profile && profile.current_rank?.belt) ? profile.current_rank.belt as BJJBelt : null}
          onSuccess={(txid) => setLastTxId(txid)}
        />
      )}
      {lastTxId && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          Submitted Tx: {lastTxId}
                      </div>
                    )}
    </div>
  );
}
