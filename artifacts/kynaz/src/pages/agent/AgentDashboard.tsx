import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Trophy, Wallet, TrendingUp, Star, Copy, CheckCircle2, Bell } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

const BADGE_COLORS: Record<string, string> = {
  bronze: "text-amber-700 bg-amber-100",
  silver: "text-gray-600 bg-gray-100",
  gold: "text-yellow-700 bg-yellow-100",
  platinum: "text-sky-700 bg-sky-100",
  elite: "text-purple-700 bg-purple-100",
};

export default function AgentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-me"],
    queryFn: () => customFetch<any>("/api/agents/me"),
  });

  const { data: broadcasts } = useQuery({
    queryKey: ["agent-broadcasts"],
    queryFn: () => customFetch<any[]>("/api/agents/broadcasts"),
  });

  const handleCopyCode = () => {
    if (data?.user?.referralCode) {
      navigator.clipboard.writeText(data.user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    }
  };

  const stats = data?.stats;

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!data?.agent && !isLoading) {
    return (
      <ProtectedLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <Star size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-serif font-bold mb-2">Agent Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">Your agent account is pending setup. Please contact your administrator.</p>
        </div>
      </ProtectedLayout>
    );
  }

  const badge = data?.agent?.badge ?? "bronze";
  const badgeClass = BADGE_COLORS[badge] ?? "text-muted-foreground bg-muted";
  const referralLink = `${window.location.origin}/register?ref=${data?.user?.referralCode}`;

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Agent Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Welcome back, {user?.fullName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${badgeClass}`}>
                {badge} Agent
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {data?.agent?.agentId}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Customers" value={stats?.totalCustomers ?? 0} icon={Users} color="bg-blue-500" />
            <StatCard title="Total Quotations" value={stats?.totalQuotations ?? 0} icon={FileText} color="bg-violet-500" />
            <StatCard title="Closed Sales" value={stats?.totalSales ?? 0} icon={TrendingUp} color="bg-emerald-500" />
            <StatCard title="Points" value={stats?.points ?? 0} icon={Trophy} color="bg-amber-500" />
          </div>
        </motion.div>

        {/* Commission + Referral */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Commission Wallet */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={20} />
                <span className="font-semibold">Commission Wallet</span>
              </div>
              <div className="text-3xl font-bold mb-1">RM {(stats?.commissionBalance ?? 0).toFixed(2)}</div>
              <div className="text-white/70 text-sm">Available balance</div>
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
                <div>
                  <div className="text-white/60">Total Earned</div>
                  <div className="font-semibold">RM {(stats?.totalCommission ?? 0).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/60">This Month Sales</div>
                  <div className="font-semibold">{stats?.monthlyQuotations ?? 0}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Referral Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-card border border-border rounded-2xl p-6 h-full">
              <h3 className="font-semibold text-foreground mb-4">Your Referral Code</h3>
              <div className="bg-muted/50 rounded-xl p-4 text-center mb-4">
                <div className="text-3xl font-mono font-bold text-primary tracking-widest">
                  {data?.user?.referralCode ?? "—"}
                </div>
              </div>
              <Button onClick={handleCopyCode} className="w-full gap-2" variant="outline">
                {copied ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Referral Code"}
              </Button>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Join Kynaz Enterprise using my referral code: ${data?.user?.referralCode}\n${referralLink}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bg-emerald-600 text-white rounded-lg py-2 text-xs font-medium text-center hover:bg-emerald-700 transition-colors"
                >WhatsApp</a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="bg-blue-600 text-white rounded-lg py-2 text-xs font-medium text-center hover:bg-blue-700 transition-colors"
                >Facebook</a>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralLink); toast({ title: "Link copied!" }); }}
                  className="bg-primary text-primary-foreground rounded-lg py-2 text-xs font-medium text-center hover:bg-primary/90 transition-colors"
                >Copy Link</button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Broadcasts */}
        {broadcasts && broadcasts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell size={18} className="text-primary" />
                <h3 className="font-semibold text-foreground">Announcements</h3>
              </div>
              <div className="space-y-3">
                {broadcasts.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="font-semibold text-foreground text-sm mb-1">{b.title}</div>
                    <div className="text-muted-foreground text-sm">{b.message}</div>
                    <div className="text-xs text-muted-foreground mt-2">{new Date(b.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/agent/customers", label: "My Customers", icon: Users },
              { href: "/agent/quotations", label: "Quotations", icon: FileText },
              { href: "/agent/commissions", label: "Commissions", icon: Wallet },
              { href: "/agent/ranking", label: "Leaderboard", icon: Trophy },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer">
                  <item.icon size={22} className="mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium text-foreground">{item.label}</div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
