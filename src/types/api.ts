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

// Summary type returned by /profiles list
export interface ProfileSummary {
  id: string;
  name: string;
  description: string;
  image_uri: string;
  type: ProfileType;
}
