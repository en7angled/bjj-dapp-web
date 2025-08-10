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

export interface ProfileActionType {
  CreateProfileWithRankAction?: {
    profileData: ProfileData;
    profileType: ProfileType;
    creationDate: string;
    belt: BJJBelt;
  };
  InitProfileAction?: {
    profileData: ProfileData;
    profileType: ProfileType;
    creationDate: string;
  };
  PromoteProfileAction?: {
    promotedProfileId: string;
    promotedByProfileId: string;
    achievementDate: string;
    promotedBelt: BJJBelt;
  };
  AcceptPromotionAction?: {
    promotionId: string;
  };
  UpdateProfileImageAction?: {
    profileId: string;
    imageURI: string;
  };
  DeleteProfileAction?: {
    profileId: string;
  };
}

// Discriminated union shape accepted by backend, used only for request payloads
export type DiscriminatedProfileAction =
  | { tag: 'CreateProfileWithRankAction'; contents: { profileData: ProfileData; profileType: ProfileType; creationDate: string; belt: BJJBelt } }
  // Some servers accept tag with fields directly (no contents)
  | { tag: 'CreateProfileWithRankAction'; profileData: ProfileData; profileType: ProfileType; creationDate: string; belt: BJJBelt }
  | { tag: 'InitProfileAction'; contents: { profileData: ProfileData; profileType: ProfileType; creationDate: string } }
  | { tag: 'UpdateProfileImageAction'; contents: { profileId: string; imageURI: string } }
  | { tag: 'DeleteProfileAction'; contents: { profileId: string } }
  | { tag: 'PromoteProfileAction'; contents: { promotedProfileId: string; promotedByProfileId: string; achievementDate: string; promotedBelt: BJJBelt } }
  | { tag: 'AcceptPromotionAction'; contents: { promotionId: string } };

export interface DiscriminatedInteraction {
  action: DiscriminatedProfileAction;
  userAddresses: UserAddresses;
  recipient?: string;
}

export interface Interaction {
  action: ProfileActionType;
  userAddresses: UserAddresses;
  recipient?: string;
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
