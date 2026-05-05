import { useEffect, useState } from "react";
import { Copy, Share2, Gift, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ReferralCard = () => {
  const { profile, user } = useAuth();
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("referrals" as any)
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .then(({ count }) => setReferralCount(count || 0));
  }, [user]);

  if (!profile) return null;

  const referralLink = `${window.location.origin}/register?ref=${profile.referral_code || ""}`;

  const copy = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Khub",
          text: "Nigeria's all-in-one marketplace. Sign up with my link!",
          url: referralLink,
        });
      } catch {/* user cancelled */}
    } else {
      copy();
    }
  };

  return (
    <div className="p-5 border border-border rounded-xl bg-gradient-to-br from-primary/5 to-accent/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Refer & Earn</h3>
          <p className="text-xs text-muted-foreground">₦500 per Verified, ₦1,000 per Premium signup</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 rounded-lg bg-card border border-border">
          <Users className="w-4 h-4 text-muted-foreground mb-1" />
          <p className="text-lg font-bold text-foreground leading-none">{referralCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Referrals</p>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border">
          <Wallet className="w-4 h-4 text-primary mb-1" />
          <p className="text-lg font-bold text-foreground leading-none">₦{Number(profile.referral_earnings || 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Earned</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border mb-3">
        <code className="text-xs text-foreground flex-1 truncate">{profile.referral_code || "—"}</code>
      </div>

      <div className="flex gap-2">
        <Button onClick={copy} variant="outline" size="sm" className="flex-1 text-xs h-8">
          <Copy className="w-3 h-3 mr-1" /> Copy Link
        </Button>
        <Button onClick={share} size="sm" className="flex-1 text-xs h-8 gradient-purple text-primary-foreground">
          <Share2 className="w-3 h-3 mr-1" /> Share
        </Button>
      </div>
    </div>
  );
};

export default ReferralCard;
