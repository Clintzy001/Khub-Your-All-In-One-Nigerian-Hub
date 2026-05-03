import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WalletData {
  id: string;
  balance: number;
  held_amount: number;
}

export const useRealtimeWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchWallet = async () => {
      const { data } = await supabase
        .from("escrow_wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setWallet(data as WalletData);
      setLoading(false);
    };

    const fetchTransactions = async () => {
      const { data: walletData } = await supabase
        .from("escrow_wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!walletData) return;

      const { data } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("wallet_id", walletData.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setTransactions(data);
    };

    fetchWallet();
    fetchTransactions();

    // Realtime wallet updates
    const walletChannel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "escrow_wallets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setWallet(payload.new as WalletData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
    };
  }, [user]);

  return { wallet, transactions, loading, refetchTransactions: async () => {
    if (!wallet) return;
    const { data } = await supabase
      .from("escrow_transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setTransactions(data);
  }};
};
