import { useAuth } from "@/contexts/AuthContext";

export type PlanTier = "basic" | "pro" | "premium";

interface PlanAccess {
  tier: PlanTier;
  maxItems: number;
  itemExpiryDays: number | null;
  canSell: boolean;
  canWithdraw: boolean;
  requiresKYC: boolean;
  boostEnabled: boolean;
}

const PLAN_CONFIG: Record<PlanTier, PlanAccess> = {
  basic: { tier: "basic", maxItems: 5, itemExpiryDays: 3, canSell: false, canWithdraw: false, requiresKYC: false, boostEnabled: false },
  pro: { tier: "pro", maxItems: 10, itemExpiryDays: null, canSell: true, canWithdraw: true, requiresKYC: true, boostEnabled: false },
  premium: { tier: "premium", maxItems: 30, itemExpiryDays: null, canSell: true, canWithdraw: true, requiresKYC: true, boostEnabled: true },
};

export const usePlanAccess = (): PlanAccess & { isKYCVerified: boolean } => {
  const { profile } = useAuth();

  let tier: PlanTier = "free";
  if (profile?.subscription_active) {
    // Determine from subscription - simplified: if KYC verified = at least verified
    tier = profile.kyc_verified ? "premium" : "verified";
  }

  return {
    ...PLAN_CONFIG[tier],
    isKYCVerified: profile?.kyc_verified ?? false,
  };
};
