import { useState } from "react";
import { ArrowUpRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "First City Monument Bank", "Globus Bank", "Guaranty Trust Bank", "Heritage Bank",
  "Keystone Bank", "Kuda Bank", "OPay", "PalmPay", "Polaris Bank",
  "Providus Bank", "Stanbic IBTC Bank", "Standard Chartered", "Sterling Bank",
  "SunTrust Bank", "Titan Trust Bank", "Union Bank", "United Bank for Africa",
  "Unity Bank", "VFD Microfinance Bank", "Wema Bank", "Zenith Bank",
];

interface WithdrawalDialogProps {
  walletBalance: number;
  walletId: string;
  onSuccess?: () => void;
}

const WithdrawalDialog = ({ walletBalance, walletId, onSuccess }: WithdrawalDialogProps) => {
  const { profile } = useAuth();
  const { canWithdraw, isKYCVerified } = usePlanAccess();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");

  const resetForm = () => {
    setStep("form");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
    setAmount("");
  };

  const handleProceed = () => {
    const amt = parseFloat(amount);
    if (!bankName || !accountNumber || !accountName || isNaN(amt)) {
      toast({ title: "Error", description: "Please fill all fields correctly", variant: "destructive" });
      return;
    }
    if (accountNumber.length !== 10) {
      toast({ title: "Error", description: "Account number must be 10 digits", variant: "destructive" });
      return;
    }
    if (amt < 500) {
      toast({ title: "Error", description: "Minimum withdrawal is ₦500", variant: "destructive" });
      return;
    }
    if (amt > walletBalance) {
      toast({ title: "Error", description: "Insufficient balance", variant: "destructive" });
      return;
    }
    setStep("confirm");
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const amt = parseFloat(amount);
      
      // Create withdrawal transaction
      const { error: txError } = await supabase.from("escrow_transactions").insert({
        wallet_id: walletId,
        amount: amt,
        type: "withdrawal",
        status: "processing",
        description: `Withdrawal to ${bankName} - ${accountNumber} (${accountName})`,
      });

      if (txError) throw txError;

      toast({ title: "Withdrawal Requested", description: `₦${amt.toLocaleString()} withdrawal is being processed` });
      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Withdrawal failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!canWithdraw || !isKYCVerified) {
    return (
      <Button variant="outline" className="flex-1 border-border text-foreground opacity-50" disabled>
        <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 border-border text-foreground">
          <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Withdraw Funds" : "Confirm Withdrawal"}</DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={500}
                max={walletBalance}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: ₦{walletBalance.toLocaleString()} • Min: ₦500
              </p>
            </div>
            <div>
              <Label>Bank Name</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>
                  {NIGERIAN_BANKS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                type="text"
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
              />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                placeholder="Account holder name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <Button onClick={handleProceed} className="w-full gradient-purple text-primary-foreground">
              Proceed
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-warning/30 bg-warning/5">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <AlertDescription className="text-sm">
                Please confirm this withdrawal is correct. This action cannot be undone.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 p-4 rounded-lg border border-border bg-accent/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground">₦{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="text-foreground">{bankName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="text-foreground">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="text-foreground">{accountName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("form")} className="flex-1">Back</Button>
              <Button onClick={handleWithdraw} disabled={loading} className="flex-1 gradient-purple text-primary-foreground">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalDialog;
