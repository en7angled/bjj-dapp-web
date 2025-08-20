import type {
  RankInformation,
  PromotionInformation,
  PractitionerProfileInformation,
  Interaction,
  AddWitAndSubmitParams,
  GYTxId,
  BeltFrequency,
  BJJBelt,
  ProfileSummary
} from '../types/api';

import { API_CONFIG } from '../config/api';

export class BeltSystemAPI {
  // Unified in-memory and localStorage-backed cache for full profile objects
  private static profileCache = new Map<string, { data: PractitionerProfileInformation; expires: number }>();
  private static profileTtlMs = 5 * 60 * 1000; // 5 minutes
  private static profileCacheStorageKey = 'profileCacheV1';

  private static loadProfileCacheFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(this.profileCacheStorageKey);
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, { data: PractitionerProfileInformation; expires: number }>;
      const now = Date.now();
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value.expires === 'number' && value.expires > now && value.data) {
          this.profileCache.set(key, value);
        }
      }
    } catch {}
  }

  private static saveProfileCacheToStorage() {
    if (typeof window === 'undefined') return;
    try {
      // Persist only a limited number of most recent entries to avoid exceeding localStorage limits
      const maxEntries = 100;
      const entries = Array.from(this.profileCache.entries())
        .filter(([, v]) => v && typeof v.expires === 'number' && v.expires > Date.now());
      // Sort by expires descending to keep freshest
      entries.sort((a, b) => b[1].expires - a[1].expires);
      const sliced = entries.slice(0, maxEntries);
      const obj = Object.fromEntries(sliced);
      window.localStorage.setItem(this.profileCacheStorageKey, JSON.stringify(obj));
    } catch {}
  }

  static clearCaches() {
    // Clear in-memory caches
    this.profileCache.clear();
    // Clear persistent caches
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(this.profileCacheStorageKey); } catch {}
      // Clean up legacy name cache if it exists
      try { window.localStorage.removeItem('profileNameCacheV1'); } catch {}
    }
  }

  static async resolveProfileName(profileId: string): Promise<string> {
    if (!profileId) return '';
    // Try unified cache first (either practitioner or organization)
    if (this.profileCache.size === 0) this.loadProfileCacheFromStorage();
    const now = Date.now();

    const candidates = (() => {
      const results = new Set<string>();
      const raw = profileId;
      results.add(raw);
      // Add dotted variant if missing dot and looks like policy+name hex
      if (!raw.includes('.') && raw.length > 56) {
        results.add(`${raw.slice(0, 56)}.${raw.slice(56)}`);
      }
      // Adjust known legacy prefix 000de14* -> 000643b*
      const addAdjusted = (id: string) => {
        const parts = id.split('.');
        if (parts.length === 2) {
          const [policy, nameHex] = parts;
          const lower = (nameHex || '').toLowerCase();
          let adjusted = lower;
          if (lower.startsWith('000de140')) adjusted = `000643b0${lower.slice(8)}`;
          else if (lower.startsWith('000de14')) adjusted = `000643b${lower.slice(7)}`;
          results.add(`${policy}.${adjusted}`);
        }
      };
      for (const id of Array.from(results)) addAdjusted(id);
      return Array.from(results);
    })();

    // Check cache for any candidate
    for (const id of candidates) {
      const prKey = `practitioner:${id}`;
      const orgKey = `organization:${id}`;
      const prCached = this.profileCache.get(prKey);
      if (prCached && prCached.expires > now && (prCached.data as PractitionerProfileInformation)?.name) return (prCached.data as PractitionerProfileInformation).name;
      const orgCached = this.profileCache.get(orgKey);
      if (orgCached && orgCached.expires > now && (orgCached.data as PractitionerProfileInformation)?.name) return (orgCached.data as PractitionerProfileInformation).name;
    }

    // Otherwise fetch using candidates
    for (const id of candidates) {
      try {
        const pr = await this.getPractitionerProfile(id);
        return pr?.name || profileId;
      } catch {}
    }
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
    
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());
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

    return fetch(`/api/belts?${searchParams.toString()}`, { headers: { Accept: 'application/json' } }).then(r => r.json());
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
    
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());
    if (params?.profile) params.profile.forEach(p => searchParams.append('profile', p));
    if (params?.belt) params.belt.forEach(b => searchParams.append('belt', b));
    if (params?.achieved_by) params.achieved_by.forEach(a => searchParams.append('achieved_by', a));
    if (params?.awarded_by) params.awarded_by.forEach(a => searchParams.append('awarded_by', a));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);

    return fetch(`/api/belts/count?${searchParams.toString()}`, { headers: { Accept: 'application/json' } }).then(r => r.json());
  }

  // Get belt frequency distribution
  static async getBeltsFrequency(): Promise<BeltFrequency[]> {
    const response = await fetch('/api/belts/frequency', { headers: { Accept: 'application/json' }, cache: 'no-store' }).then(r => r.json()) as [BJJBelt, number][];
    return response.map(([belt, count]) => ({ belt, count }));
  }

  // Get practitioner profile
  static async getPractitionerProfile(profileId: string): Promise<PractitionerProfileInformation> {
    const now = Date.now();
    if (this.profileCache.size === 0) this.loadProfileCacheFromStorage();
    const cacheKey = `practitioner:${profileId}`;
    const cached = this.profileCache.get(cacheKey);
    if (cached && cached.expires > now) return cached.data as PractitionerProfileInformation;
    // Use Next.js API proxy to avoid CORS
    const resp = await fetch(`/api/practitioner/${encodeURIComponent(profileId)}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    const data = await resp.json();
    this.profileCache.set(cacheKey, { data, expires: now + this.profileTtlMs });
    this.saveProfileCacheToStorage();
    return data;
  }

  // Removed getOrganizationProfile method as requested

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
    
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.offset !== undefined) searchParams.append('offset', params.offset.toString());
    if (params?.profile) params.profile.forEach(p => searchParams.append('profile', p));
    if (params?.belt) params.belt.forEach(b => searchParams.append('belt', b));
    if (params?.achieved_by) params.achieved_by.forEach(a => searchParams.append('achieved_by', a));
    if (params?.awarded_by) params.awarded_by.forEach(a => searchParams.append('awarded_by', a));
    if (params?.from) searchParams.append('from', params.from);
    if (params?.to) searchParams.append('to', params.to);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.order) searchParams.append('order', params.order);

    return fetch(`/api/promotions?${searchParams.toString()}`, { headers: { Accept: 'application/json' } }).then(r => r.json());
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

    return fetch(`/api/promotions/count?${searchParams.toString()}`, { headers: { Accept: 'application/json' } }).then(r => r.json());
  }

  // Build transaction
  static async buildTransaction(interaction: Interaction): Promise<string> {
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

  static async putProfileMetadata(payload: { profile_id: string; location?: string; phone?: string; email?: string; website?: string; image_url?: string; }): Promise<{ ok: boolean; updated_at: string }> {
    // Ensure all named parameters exist (SQLite named params require presence)
    const body = {
      profile_id: payload.profile_id,
      location: payload.location ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      website: payload.website ?? null,
      image_url: payload.image_url ?? null,
    };
    const resp = await fetch('/api/profile-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
    profile_type?: string[]; // expects values like 'Practitioner' | 'Organization'
    name?: string;
    description?: string;
    order_by?: 'id' | 'name' | 'description' | 'type';
    order?: 'asc' | 'desc';
  }): Promise<ProfileSummary[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.append('offset', String(params.offset));
    if (params?.profile_type) {
      params.profile_type.forEach((p) => {
        const norm = p === 'practitioner' ? 'Practitioner' : p === 'organization' ? 'Organization' : p;
        searchParams.append('profile-type', norm);
      });
    }
    if (params?.name) searchParams.append('name', params.name);
    if (params?.description) searchParams.append('description', params.description);
    if (params?.order_by) searchParams.append('order_by', params.order_by);
    if (params?.order) searchParams.append('order', params.order);
    return fetch(`/api/profiles?${searchParams.toString()}`, { headers: { Accept: 'application/json' } }).then(r => r.json());
  }

  static async getProfilesCount(params?: {
    limit?: number;
    offset?: number;
    profile_type?: string[];
    name?: string;
    description?: string;
  }): Promise<number> {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.append('limit', String(params.limit));
    if (params?.offset !== undefined) searchParams.append('offset', String(params.offset));
    if (params?.profile_type) {
      params.profile_type.forEach((p) => {
        const norm = p === 'practitioner' ? 'Practitioner' : p === 'organization' ? 'Organization' : p;
        searchParams.append('profile-type', norm);
      });
    }
    if (params?.name) searchParams.append('name', params.name);
    if (params?.description) searchParams.append('description', params.description);
    return fetch(`/api/profiles/count?${searchParams.toString()}`, { headers: { Accept: 'application/json' } }).then(r => r.json());
  }

  // Fetch all profiles by paging through results; use cautiously
  static async getAllProfiles(params?: { profile_type?: string[] }): Promise<ProfileSummary[]> {
    const pageSize = 200;
    let offset = 0;
    const all: ProfileSummary[] = [];
    while (true) {
      const page = await this.getProfiles({ limit: pageSize, offset, profile_type: params?.profile_type });
      all.push(...page);
      if (!page || page.length < pageSize) break;
      offset += pageSize;
      // safety cap to avoid runaway
      if (offset > 10000) break;
    }
    return all;
  }
}
