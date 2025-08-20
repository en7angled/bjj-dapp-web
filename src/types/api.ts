export type BJJBelt = 
  | "White" | "Blue" | "Purple" | "Brown" | "Black" 
  | "Black1" | "Black2" | "Black3" | "Black4" | "Black5" | "Black6"
  | "RedAndBlack" | "RedAndWhite" | "Red" | "Red10";

export type ProfileType = "Practitioner" | "Organization";

export interface ProfileData {
  name: string;
  description: string;
  image_uri: string;
}

export interface RankInformation {
  id: string;
  belt: BJJBelt;
  achieved_by_profile_id: string;
  awarded_by_profile_id: string;
  achievement_date: string;
}

export interface PromotionInformation {
  id: string;
  belt: BJJBelt;
  achieved_by_profile_id: string;
  awarded_by_profile_id: string;
  achievement_date: string;
}

export interface PractitionerProfileInformation {
  id: string;
  name: string;
  description: string;
  image_uri: string;
  current_rank: RankInformation;
  previous_ranks: RankInformation[];
}

export interface OrganizationProfileInformation {
  id: string;
  name: string;
  description: string;
  image_uri: string;
}

export interface UserAddresses {
  usedAddresses: string[];
  changeAddress: string;
  reservedCollateral?: string;
}

// Backend expects tag + direct fields format (no contents wrapper)
export type ProfileActionType =
  | { tag: 'CreateProfileWithRankAction'; profile_data: ProfileData; profile_type: ProfileType; creation_date: string; belt: BJJBelt }
  | { tag: 'InitProfileAction'; profile_data: ProfileData; profile_type: ProfileType; creation_date: string }
  | { tag: 'UpdateProfileImageAction'; profile_id: string; image_uri: string }
  | { tag: 'DeleteProfileAction'; profileIdentifier: string }
  | { tag: 'PromoteProfileAction'; promoted_profile_id: string; promoted_by_profile_id: string; achievement_date: string; promoted_belt: BJJBelt }
  | { tag: 'AcceptPromotionAction'; promotion_id: string };

export interface Interaction {
  action: ProfileActionType;
  userAddresses: UserAddresses;
  recipient: string; // Required according to backend schema
}

export interface AddWitAndSubmitParams {
  tx_unsigned: string;
  tx_wit: string;
}

export interface GYTxId {
  id: string;
}

export interface BeltFrequency {
  belt: BJJBelt;
  count: number;
}

export interface TopAcademy {
  id: string;
  name: string;
  beltCount: number;
  promotionCount: number;
}

// Summary type returned by /profiles list
export interface ProfileSummary {
  id: string;
  name: string;
  description: string;
  image_uri: string;
  type: ProfileType;
}

// Error types for better error handling
export interface APIError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface WalletError {
  message: string;
  code: 'NETWORK_MISMATCH' | 'CONNECTION_FAILED' | 'NO_WALLET' | 'SIGNATURE_FAILED' | 'INVALID_ADDRESS';
  details?: Record<string, unknown>;
}

export interface TransactionError {
  message: string;
  code: 'BUILD_FAILED' | 'SIGNATURE_FAILED' | 'SUBMISSION_FAILED' | 'CONFIRMATION_FAILED';
  txId?: string;
  details?: Record<string, unknown>;
}

// Database types
export interface DatabaseError {
  message: string;
  code: 'CONNECTION_FAILED' | 'QUERY_FAILED' | 'INITIALIZATION_FAILED';
  details?: Record<string, unknown>;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  expires: number;
  timestamp: number;
}

// Wallet connection types
export interface WalletConnection {
  name: string;
  networkId: number;
  addresses: string[];
  changeAddress: string;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code: 'REQUIRED' | 'INVALID_FORMAT' | 'MIN_LENGTH' | 'MAX_LENGTH' | 'CUSTOM';
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
}

// API Response types
export interface APIResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Component prop types
export interface LoadingState {
  isLoading: boolean;
  error: APIError | null;
  retry?: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

// Modal types
export interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  error: APIError | null;
}

// File upload types
export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  error: APIError | null;
  url?: string;
}

// Search types
export interface SearchState<T> {
  query: string;
  results: T[];
  isLoading: boolean;
  error: APIError | null;
  hasMore: boolean;
}

// Filter types
export interface FilterState {
  [key: string]: string | string[] | number | boolean | null;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Theme types
export interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  isDark: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
