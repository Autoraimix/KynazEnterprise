import { useState, useEffect } from "react";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Mail, Phone, Shield, Tag, Calendar,
  Pencil, Save, X, Lock, Eye, EyeOff, CreditCard, Building2,
} from "lucide-react";
import type { User as AuthUser } from "@workspace/api-client-react";

interface ProfileData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  referralCode: string;
  cashbackBalance: number;
  isVerified: boolean;
  mustChangePassword: boolean;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  createdAt: string;
}

export default function Profile() {
  const { user: authUser, token, updateUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ fullName: "", phone: "", email: "" });
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingBank, setEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: "", bankAccountNumber: "", bankAccountName: "" });
  const [savingBank, setSavingBank] = useState(false);

  const [showPwSection, setShowPwSection] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as ProfileData;
        setProfile(data);
        setInfoForm({ fullName: data.fullName, phone: data.phone, email: data.email });
        setBankForm({
          bankName: data.bankName ?? "",
          bankAccountNumber: data.bankAccountNumber ?? "",
          bankAccountName: data.bankAccountName ?? "",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [token]);

  const saveInfo = async () => {
    if (!token) return;
    setSavingInfo(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: infoForm.fullName.trim(),
          phone: infoForm.phone.trim(),
          email: infoForm.email.trim(),
        }),
      });
      const data = await res.json() as ProfileData & { error?: string };
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to update profile.", variant: "destructive" });
        return;
      }
      setProfile(data);
      setInfoForm({ fullName: data.fullName, phone: data.phone, email: data.email });
      updateUser(data as unknown as AuthUser);
      setEditingInfo(false);
      toast({ title: "Profile updated!", description: "Your personal details have been saved." });
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setSavingInfo(false);
    }
  };

  const saveBank = async () => {
    if (!token) return;
    setSavingBank(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bankName: bankForm.bankName.trim() || null,
          bankAccountNumber: bankForm.bankAccountNumber.trim() || null,
          bankAccountName: bankForm.bankAccountName.trim() || null,
        }),
      });
      const data = await res.json() as ProfileData & { error?: string };
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to update bank details.", variant: "destructive" });
        return;
      }
      setProfile(data);
      setBankForm({
        bankName: data.bankName ?? "",
        bankAccountNumber: data.bankAccountNumber ?? "",
        bankAccountName: data.bankAccountName ?? "",
      });
      setEditingBank(false);
      toast({ title: "Bank details saved!", description: "Your bank information has been updated." });
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setSavingBank(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) {
        toast({ title: "Error", description: data.error ?? "Failed to change password.", variant: "destructive" });
        return;
      }
      toast({ title: "Password changed!", description: "Your password has been updated." });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPwSection(false);
    } catch {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setSavingPw(false);
    }
  };

  if (!authUser) return null;

  return (
    <ProtectedLayout>
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account information and bank details</p>
        </motion.div>

        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-serif font-bold text-2xl shrink-0">
            {(profile?.fullName ?? authUser.fullName).charAt(0)}
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground">{profile?.fullName ?? authUser.fullName}</div>
            <div className="text-muted-foreground text-sm">{profile?.email ?? authUser.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                (profile?.isVerified ?? authUser.isVerified) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {(profile?.isVerified ?? authUser.isVerified) ? "Verified" : "Unverified"}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary capitalize">
                {authUser.role}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><User size={16} className="text-primary" /> Personal Details</h2>
            {!editingInfo ? (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-primary border-primary/20" onClick={() => setEditingInfo(true)}>
                <Pencil size={13} /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => {
                  setEditingInfo(false);
                  setInfoForm({ fullName: profile?.fullName ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" });
                }}>
                  <X size={13} /> Cancel
                </Button>
                <Button size="sm" className="gap-1.5 h-8 bg-primary text-white" onClick={saveInfo} disabled={savingInfo}>
                  <Save size={13} /> {savingInfo ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : editingInfo ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-8" value={infoForm.fullName} onChange={e => setInfoForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-8" value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input type="email" className="pl-8" value={infoForm.email} onChange={e => setInfoForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: User, label: "Full Name", value: profile?.fullName ?? authUser.fullName },
                { icon: Mail, label: "Email Address", value: profile?.email ?? authUser.email },
                { icon: Phone, label: "Phone Number", value: profile?.phone ?? authUser.phone },
                { icon: Shield, label: "Account Role", value: authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1) },
                { icon: Tag, label: "Referral Code", value: profile?.referralCode ?? authUser.referralCode },
                { icon: Calendar, label: "Member Since", value: profile ? new Date(profile.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" }) : "—" },
              ].map(field => (
                <div key={field.label} className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <field.icon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">{field.label}</div>
                    <div className="text-sm font-medium text-foreground">{field.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bank Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Building2 size={16} className="text-primary" /> Bank Details</h2>
            {!editingBank ? (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-primary border-primary/20" onClick={() => setEditingBank(true)}>
                <Pencil size={13} /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => {
                  setEditingBank(false);
                  setBankForm({ bankName: profile?.bankName ?? "", bankAccountNumber: profile?.bankAccountNumber ?? "", bankAccountName: profile?.bankAccountName ?? "" });
                }}>
                  <X size={13} /> Cancel
                </Button>
                <Button size="sm" className="gap-1.5 h-8 bg-primary text-white" onClick={saveBank} disabled={savingBank}>
                  <Save size={13} /> {savingBank ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : editingBank ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Bank Name</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-8" placeholder="e.g. Maybank, CIMB, RHB" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Account Number</label>
                <div className="relative">
                  <CreditCard size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-8" placeholder="e.g. 1234567890" value={bankForm.bankAccountNumber} onChange={e => setBankForm(f => ({ ...f, bankAccountNumber: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Account Holder Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name as per bank account" value={bankForm.bankAccountName} onChange={e => setBankForm(f => ({ ...f, bankAccountName: e.target.value }))} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: Building2, label: "Bank Name", value: profile?.bankName },
                { icon: CreditCard, label: "Account Number", value: profile?.bankAccountNumber },
                { icon: User, label: "Account Holder", value: profile?.bankAccountName },
              ].map(field => (
                <div key={field.label} className="flex items-center gap-4 py-2.5 border-b border-border last:border-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <field.icon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">{field.label}</div>
                    <div className="text-sm font-medium text-foreground">{field.value ?? <span className="text-muted-foreground italic">Not set</span>}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Cashback Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-primary text-white rounded-xl p-6">
          <div className="text-white/70 text-sm mb-1">Current Cashback Balance</div>
          <div className="text-3xl font-bold">RM {(profile?.cashbackBalance ?? authUser.cashbackBalance).toFixed(2)}</div>
          <div className="text-white/60 text-xs mt-1">Available for redemption on future services</div>
        </motion.div>

        {/* Change Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Lock size={16} className="text-primary" /> Change Password</h2>
            {!showPwSection && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-primary border-primary/20" onClick={() => setShowPwSection(true)}>
                <Pencil size={13} /> Change
              </Button>
            )}
          </div>

          {!showPwSection ? (
            <p className="text-sm text-muted-foreground mt-2">Update your login password at any time.</p>
          ) : (
            <form onSubmit={changePassword} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Current Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input type={showCurrent ? "text" : "password"} className="pl-8 pr-10" placeholder="Your current password"
                    value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-3 text-muted-foreground">
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input type={showNew ? "text" : "password"} className="pl-8 pr-10" placeholder="Min. 6 characters"
                    value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-3 text-muted-foreground">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input type={showConfirm ? "text" : "password"} className="pl-8 pr-10" placeholder="Repeat new password"
                    value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-3 text-muted-foreground">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 gap-2" onClick={() => {
                  setShowPwSection(false);
                  setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}>
                  <X size={14} /> Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2 bg-primary text-white" disabled={savingPw}>
                  <Save size={14} /> {savingPw ? "Saving…" : "Update Password"}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
