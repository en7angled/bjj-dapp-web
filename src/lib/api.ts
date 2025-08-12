import ky from 'ky';
import type {
  RankInformation,
  PromotionInformation,
  PractitionerProfileInformation,
  OrganizationProfileInformation,
  ProfileData,
  Interaction,
  DiscriminatedInteraction,
  AddWitAndSubmitParams,
  GYTxId,
  BeltFrequency,
  BJJBelt
} from '../types/api';

import { API_CONFIG } from '../config/api';

const api = ky.create({
  prefixUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  retry: API_CONFIG.RETRY_ATTEMPTS,
  headers: {
    'Authorization': `Basic ${btoa(`${API_CONFIG.AUTH.USERNAME}:${API_CONFIG.AUTH.PASSWORD}`)}`
  }
});

export class BeltSystemAPI {
  // In-memory and localStorage-backed cache for id -> profile name
  private static profileNameCache: Map<string, string> = new Map();
  private static storageKey = 'profileNameCacheV1';

  private static loadNameCacheFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(obj)) this.profileNameCache.set(k, v);
    } catch {}
  }

  private static saveNameCacheToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const obj = Object.fromEntries(this.profileNameCache.entries());
      window.localStorage.setItem(this.storageKey, JSON.stringify(obj));
    } catch {}
  }

  static async resolveProfileName(profileId: string): Promise<string> {
    if (!profileId) return '';
    // lazy-load cache from storage once per session
    if (this.profileNameCache.size === 0) this.loadNameCacheFromStorage();
    const cached = this.profileNameCache.get(profileId);
    if (cached) return cached;
    try {
      const pr = await this.getPractitionerProfile(profileId);
      if (pr?.name) {
        this.profileNameCache.set(profileId, pr.name);
        this.saveNameCacheToStorage();
        return pr.name;
      }
    } catch {}
    try {
      const org = await this.getOrganizationProfile(profileId);
      if (org?.name) {
        this.profileNameCache.set(profileId, org.name);
        this.saveNameCacheToStorage();
        return org.name;
      }
    } catch {}
    // fallback to id if nothing resolved
    this.profileNameCache.set(profileId, profileId);
    this.saveNameCacheToStorage();
    return profileId;
  }
  // Get all belts with optional filtering
  static async getBelts(params?: {
    limit?: number;
    offset?: number;
    profile?: string[];
    belt?: BJJBelt[];
    achieved_by?: string[];
    awarded_by?: string[];
    from?: string;
      to?: string;
      order_by?: 'id' | 'belt' | 'achieved_by' | 'awarded_by' | 'date';
      order?: 'asc' | 'desc';
  }): Promise<RankInformation[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.profile) params.profile.forEach(p => searchParams.append('profile', p));
    if (params?.belt) params.belt.forEach(b => searchParams.append('belt', b));
    if (params?.achieved_by) params.achieved_by.forEach(a => searchParams.append('achieved_by', a));
    if (params?.awarded_by) params.awarded_by.forEach(a => searchParams.append('awarded_by', a));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    // Prefer server-side ordering for stable pagination
    const orderBy = params?.order_by || 'date';
    const order = params?.order || 'desc';
    searchParams.append('order_by', orderBy);
    searchParams.append('order', order);

    return api.get(`belts?${searchParams.toString()}`).json();
  }

  // Get belts count
  static async getBeltsCount(params?: {
    limit?: number;
    offset?: number;
    profile?: string[];
    belt?: BJJBelt[];
    achieved_by?: string[];
    awarded_by?: string[];
    from?: string;
    to?: string;
  }): Promise<number> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.profile) params.profile.forEach(p => searchParams.append('profile', p));
    if (params?.belt) params.belt.forEach(b => searchParams.append('belt', b));
    if (params?.achieved_by) params.achieved_by.forEach(a => searchParams.append('achieved_by', a));
    if (params?.awarded_by) params.awarded_by.forEach(a => searchParams.append('awarded_by', a));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);

    return api.get(`belts/count?${searchParams.toString()}`).json();
  }

  // Get belt frequency distribution
  static async getBeltsFrequency(): Promise<BeltFrequency[]> {
    const response = await api.get('belts/frequency').json() as [BJJBelt, number][];
    return response.map(([belt, count]) => ({ belt, count }));
  }

  // Get practitioner profile
  static async getPractitionerProfile(profileId: string): Promise<PractitionerProfileInformation> {
    // Use Next.js API proxy to avoid CORS
    const resp = await fetch(`/api/practitioner/${encodeURIComponent(profileId)}`, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    return resp.json();
  }

  // Get organization profile
  static async getOrganizationProfile(organizationId: string): Promise<OrganizationProfileInformation> {
    const resp = await fetch(`/api/organization/${encodeURIComponent(organizationId)}`, { headers: { Accept: 'application/json' } });
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    return resp.json();
  }

  // Get pending promotions
  static async getPromotions(params?: {
    limit?: number;
    offset?: number;
    profile?: string[];
    belt?: BJJBelt[];
    achieved_by?: string[];
    awarded_by?: string[];
    from?: string;
    to?: string;
    order_by?: 'id' | 'belt' | 'achieved_by' | 'awarded_by' | 'date';
    order?: 'asc' | 'desc';
  }): Promise<PromotionInformation[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.profile) params.profile.forEach(p => searchParams.append('profile', p));
    if (params?.belt) params.belt.forEach(b => searchParams.append('belt', b));
    if (params?.achieved_by) params.achieved_by.forEach(a => searchParams.append('achieved_by', a));
    if (params?.awarded_by) params.awarded_by.forEach(a => searchParams.append('awarded_by', a));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.order) searchParams.append('order', params.order);

    return api.get(`promotions?${searchParams.toString()}`).json();
  }

  // Get promotions count
  static async getPromotionsCount(params?: {
    limit?: number;
    offset?: number;
    profile?: string[];
    belt?: BJJBelt[];
    achieved_by?: string[];
    awarded_by?: string[];
    from?: string;
    to?: string;
  }): Promise<number> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.profile) params.profile.forEach(p => searchParams.append('profile', p));
    if (params?.belt) params.belt.forEach(b => searchParams.append('belt', b));
    if (params?.achieved_by) params.achieved_by.forEach(a => searchParams.append('achieved_by', a));
    if (params?.awarded_by) params.awarded_by.forEach(a => searchParams.append('awarded_by', a));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);

    return api.get(`promotions/count?${searchParams.toString()}`).json();
  }

  // Build transaction
  static async buildTransaction(interaction: Interaction | DiscriminatedInteraction): Promise<string> {
    // Route through Next.js API to avoid CORS and keep credentials server-side
    const resp = await fetch('/api/build-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(interaction),
    });
    let text = await resp.text();
    if (!resp.ok) {
      throw new Error(text || `HTTP ${resp.status}`);
    }
    // Backend may return a JSON string (e.g., "84a7...")
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') {
        text = parsed;
      }
    } catch {
      // not JSON, keep as-is
    }
    // remove any surrounding quotes/whitespace just in case
    text = text.trim();
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }
    return text;
  }

  // Submit signed transaction
  static async submitTransaction(params: AddWitAndSubmitParams): Promise<GYTxId> {
    const resp = await fetch('/api/submit-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(params),
    });
    const text = await resp.text();
    if (!resp.ok) {
      throw new Error(text || `HTTP ${resp.status}`);
    }
    try { return JSON.parse(text) as GYTxId; } catch { return { id: text as unknown as string }; }
  }

  // Analytics methods
  static async getActiveProfilesCount(): Promise<number> {
    // For now, return the total profiles count
    // In the future, this could be enhanced to filter by active status
    return this.getProfilesCount();
  }

  static async getRecentPromotions(days: number = 30): Promise<PromotionInformation[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    return this.getPromotions({
      from: fromDate.toISOString(),
      to: new Date().toISOString(),
      limit: 100, // Get more recent promotions for analytics
      order_by: 'date',
      order: 'desc',
    });
  }

  static async getTopPerformingAcademies(limit: number = 5): Promise<Array<{ academyId: string; academyName: string; beltCount: number }>> {
    // Get all belts and group by awarded_by to find top academies
    const allBelts = await this.getBelts({ limit: 1000 }); // Get a large number to analyze
    
    // Group by academy and count belts
    const academyStats = new Map<string, { name: string; count: number }>();
    
    allBelts.forEach(belt => {
      const academyId = belt.awarded_by_profile_id;
      if (academyId) {
        const current = academyStats.get(academyId) || { name: 'Unknown Academy', count: 0 };
        academyStats.set(academyId, { ...current, count: current.count + 1 });
      }
    });
    
    // Sort by count and return top performers
    return Array.from(academyStats.entries())
      .map(([id, stats]) => ({ academyId: id, academyName: stats.name, beltCount: stats.count }))
      .sort((a, b) => b.beltCount - a.beltCount)
      .slice(0, limit);
  }

  static async getMonthlyGrowthRate(): Promise<number> {
    // Calculate growth rate based on promotions in current month vs previous month
    const currentMonth = new Date();
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const currentMonthPromotions = await this.getPromotions({
      from: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString(),
      to: new Date().toISOString(),
      order_by: 'date',
      order: 'desc',
    });
    
    const previousMonthPromotions = await this.getPromotions({
      from: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1).toISOString(),
      to: new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0).toISOString(),
      order_by: 'date',
      order: 'desc',
    });
    
    if (previousMonthPromotions.length === 0) {
      return currentMonthPromotions.length > 0 ? 100 : 0; // 100% growth if going from 0 to some
    }
    
    const growthRate = ((currentMonthPromotions.length - previousMonthPromotions.length) / previousMonthPromotions.length) * 100;
    return Math.round(growthRate * 10) / 10; // Round to 1 decimal place
  }

  // Profile metadata (off-chain) via Next API
  static async getProfileMetadata(profileId: string): Promise<{ profile_id: string; location?: string; phone?: string; email?: string; website?: string; updated_at?: string; }> {
    const resp = await fetch(`/api/profile-metadata?id=${encodeURIComponent(profileId)}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async putProfileMetadata(payload: { profile_id: string; location?: string; phone?: string; email?: string; website?: string; }): Promise<{ ok: boolean; updated_at: string }> {
    const resp = await fetch('/api/profile-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  static async uploadProfileImage(profileId: string, file: File): Promise<{ ok: true; image_url: string }> {
    const data = new FormData();
    data.append('profile_id', profileId);
    data.append('file', file);
    const resp = await fetch('/api/profile-image', { method: 'POST', body: data });
    if (!resp.ok) throw new Error(await resp.text());
    return resp.json();
  }

  // Profile-related endpoints
  static async getProfiles(params?: {
    limit?: number;
    offset?: number;
    profile_type?: string[];
    from?: string;
    to?: string;
  }): Promise<(PractitionerProfileInformation | OrganizationProfileInformation)[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    if (params?.profile_type) params.profile_type.forEach((p) => searchParams.append('profile_type', p));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    return api.get(`profiles?${searchParams.toString()}`).json();
  }

  static async getProfilesCount(params?: {
    limit?: number;
    offset?: number;
    profile_type?: string[];
    from?: string;
    to?: string;
  }): Promise<number> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.offset) searchParams.append('offset', String(params.offset));
    if (params?.profile_type) params.profile_type.forEach((p) => searchParams.append('profile_type', p));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    return api.get(`profiles/count?${searchParams.toString()}`).json();
  }
}
