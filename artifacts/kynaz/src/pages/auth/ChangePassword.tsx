import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ChangePassword() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || !token) {
    setLocation("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please confirm your new password.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json() as { message?: string; error?: string };

      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to change password.", variant: "destructive" });
        return;
      }

      toast({ title: "Password changed!", description: "Your password has been updated. Welcome to Kynaz!" });

      const role = user.role;
      if (role === "superadmin") setLocation("/superadmin");
      else if (role === "admin") setLocation("/admin");
      else if (role === "agent") setLocation("/agent");
      else setLocation("/dashboard");
    } catch {
      toast({ title: "Error", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-100 border border-amber-200 rounded-2xl mx-auto mb-6">
            <ShieldCheck className="text-amber-600" size={32} />
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center mb-1">Set New Password</h1>
          <p className="text-muted-foreground text-sm text-center mb-8">
            Your account requires a password change before you can continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className="pl-9 pr-10"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your new password"
                  className="pl-9 pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Set Password & Continue"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
