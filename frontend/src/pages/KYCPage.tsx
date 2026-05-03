import { useState } from "react";
import { Upload, Camera, Loader2, CheckCircle, Clock, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const KYCPage = () => {
  const { user, profile, isAuthenticated, loading: authLoading, refreshProfile } = useAuth();
  const [idType, setIdType] = useState("nin");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return <div className="container py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  if (!isAuthenticated) return (
    <div className="container py-20 text-center">
      <h2 className="text-xl font-semibold text-foreground">Please login to verify your identity</h2>
      <Link to="/login"><Button className="mt-4 gradient-purple text-primary-foreground">Login</Button></Link>
    </div>
  );

  if (profile?.kyc_verified) {
    return (
      <div className="container py-16 max-w-md text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground">Identity Verified</h1>
        <p className="text-muted-foreground mt-2">Your KYC verification is complete. You have full access to all platform features.</p>
        <Link to="/dashboard"><Button className="mt-6 gradient-purple text-primary-foreground">Go to Dashboard</Button></Link>
      </div>
    );
  }

  if (profile?.kyc_document_url) {
    return (
      <div className="container py-16 max-w-md text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-warning" />
        </motion.div>
        <h1 className="text-2xl font-bold text-foreground">Verification Pending</h1>
        <p className="text-muted-foreground mt-2">Your documents are being reviewed. This usually takes 24-48 hours.</p>
        <Link to="/dashboard"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "id" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(file);
    if (type === "id") { setIdFile(file); setIdPreview(url); }
    else { setSelfieFile(file); setSelfiePreview(url); }
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile || !user) {
      toast({ title: "Missing files", description: "Please upload both ID and selfie", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const idExt = idFile.name.split(".").pop();
      const selfieExt = selfieFile.name.split(".").pop();
      const idPath = `${user.id}/id-${Date.now()}.${idExt}`;
      const selfiePath = `${user.id}/selfie-${Date.now()}.${selfieExt}`;

      const [idUpload, selfieUpload] = await Promise.all([
        supabase.storage.from("kyc-documents").upload(idPath, idFile),
        supabase.storage.from("kyc-documents").upload(selfiePath, selfieFile),
      ]);

      if (idUpload.error) throw idUpload.error;
      if (selfieUpload.error) throw selfieUpload.error;

      const kycDocUrl = `${idType}|${idPath}|${selfiePath}`;
      const { error } = await supabase
        .from("profiles")
        .update({ kyc_document_url: kycDocUrl })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Documents Submitted", description: "Your KYC documents are under review" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8 max-w-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
        <p className="text-muted-foreground mt-2 text-sm">Verify your identity to unlock selling, withdrawals, and premium features</p>
      </div>

      <div className="space-y-6 border border-border rounded-2xl bg-card p-6">
        {/* ID Type */}
        <div>
          <Label>ID Type</Label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nin">National ID (NIN)</SelectItem>
              <SelectItem value="voters_card">Voter's Card</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="passport">International Passport</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID Upload */}
        <div>
          <Label>Upload ID Document</Label>
          <div className="mt-2">
            {idPreview ? (
              <div className="relative">
                <img src={idPreview} alt="ID Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setIdFile(null); setIdPreview(null); }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-accent/20">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload ID</span>
                <span className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF (max 5MB)</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileSelect(e, "id")} />
              </label>
            )}
          </div>
        </div>

        {/* Selfie Upload */}
        <div>
          <Label>Upload Selfie (holding your ID)</Label>
          <div className="mt-2">
            {selfiePreview ? (
              <div className="relative">
                <img src={selfiePreview} alt="Selfie Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-accent/20">
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Take a selfie with your ID</span>
                <span className="text-xs text-muted-foreground mt-1">Clear face + visible ID</span>
                <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFileSelect(e, "selfie")} />
              </label>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 rounded-lg bg-accent/50 border border-border">
          <p className="text-xs font-medium text-foreground mb-1">📋 Tips for fast approval:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Ensure your ID is clear and not expired</li>
            <li>• Selfie must show your face and the ID clearly</li>
            <li>• Good lighting, no blurry images</li>
          </ul>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!idFile || !selfieFile || submitting}
          className="w-full gradient-purple text-primary-foreground"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : "Submit for Verification"}
        </Button>
      </div>
    </div>
  );
};

export default KYCPage;
