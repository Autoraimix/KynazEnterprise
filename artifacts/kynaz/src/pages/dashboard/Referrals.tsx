import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useGetMyReferralCode, useListReferrals } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Copy, Users, DollarSign, Share2, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Referrals() {
  const { data: referralCode, isLoading: codeLoading } = useGetMyReferralCode();
  const { data: referrals, isLoading: referralsLoading } = useListReferrals();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-4xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Referral Program</h1>
          <p className="text-muted-foreground text-sm mt-1">Invite friends and earn cashback rewards</p>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-primary text-white rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2"><Gift size={22} /> How Referrals Work</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Share your code", desc: "Share your unique referral code with friends and family" },
                { step: "2", title: "They register", desc: "Your referral registers and uses Kynaz services" },
                { step: "3", title: "You earn cashback", desc: "Earn cashback rewards for every successful referral" },
              ].map(item => (
                <div key={item.step} className="bg-white/10 rounded-xl p-4">
                  <div className="w-8 h-8 bg-secondary/40 rounded-full flex items-center justify-center text-secondary font-bold text-sm mb-3">{item.step}</div>
                  <div className="font-semibold mb-1">{item.title}</div>
                  <div className="text-white/70 text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Referral Code Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Share2 size={18} className="text-primary" /> Your Referral Code</h3>
            {codeLoading ? (
              <Skeleton className="h-16 rounded-xl" />
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold font-mono text-primary tracking-widest" data-testid="text-referral-code">
                    {referralCode?.code}
                  </div>
                </div>
                <Button
                  data-testid="button-copy-code"
                  onClick={copyCode}
                  className={`w-full gap-2 h-11 ${copied ? "bg-secondary text-white" : "bg-primary text-white"}`}
                >
                  {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="space-y-4">
            {[
              { label: "Total Referrals", value: referralCode?.totalReferrals ?? 0, icon: Users, color: "text-primary bg-primary/10" },
              { label: "Total Earned", value: `RM ${(referralCode?.totalEarned ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-secondary bg-secondary/10" },
            ].map((stat, i) => (
              <div key={stat.label} className={`bg-card border border-border rounded-xl p-5 flex items-center gap-4 ${codeLoading ? "animate-pulse" : ""}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={22} />
                </div>
                <div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                  <div className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Referrals Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-5">Your Referrals</h3>
          {referralsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !referrals?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No referrals yet. Share your code to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((ref, i) => (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  data-testid={`row-referral-${ref.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-xs">{ref.referredUserName[0]}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{ref.referredUserName}</div>
                      <div className="text-xs text-muted-foreground">{new Date(ref.createdAt).toLocaleDateString("en-MY")}</div>
                    </div>
                  </div>
                  <div className="text-emerald-600 font-semibold text-sm">+RM {ref.cashbackEarned.toFixed(2)}</div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
