import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Wallet, FileText, Shield, Bell, Clock, AlertCircle, CheckCircle2, ArrowRight, Plus } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useGetDashboardSummary();

  const statsCards = [
    {
      label: "Cashback Balance",
      value: isLoading ? null : `RM ${summary?.cashbackBalance?.toFixed(2) ?? "0.00"}`,
      icon: Wallet,
      color: "text-secondary",
      bg: "bg-secondary/10",
      href: "/dashboard/cashback",
    },
    {
      label: "Active Policies",
      value: isLoading ? null : summary?.activePolicies ?? 0,
      icon: Shield,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/quotations",
    },
    {
      label: "Pending Quotations",
      value: isLoading ? null : summary?.pendingQuotations ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-100",
      href: "/dashboard/quotations",
    },
    {
      label: "Notifications",
      value: isLoading ? null : summary?.unreadNotifications ?? 0,
      icon: Bell,
      color: "text-blue-600",
      bg: "bg-blue-100",
      href: "/dashboard/notifications",
    },
  ];

  return (
    <ProtectedLayout>
      <div className="space-y-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Welcome back, {user?.fullName?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your account overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={card.href}>
                <div
                  data-testid={`card-stat-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    <div className="text-xl font-bold text-foreground">{card.value}</div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Quotations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Recent Quotations
              </h2>
              <Link href="/dashboard/quotations/new">
                <Button size="sm" className="bg-primary text-white h-8 gap-1">
                  <Plus size={14} /> New
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
              </div>
            ) : summary?.recentQuotations?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No quotations yet</p>
                <Link href="/dashboard/quotations/new">
                  <Button size="sm" variant="outline" className="mt-3">Request First Quotation</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {summary?.recentQuotations?.map(q => {
                  const status = statusConfig[q.status] ?? statusConfig.pending;
                  return (
                    <Link key={q.id} href={`/dashboard/quotations/${q.id}`}>
                      <div
                        data-testid={`row-quotation-${q.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-medium text-sm text-foreground">{q.serviceName}</div>
                          <div className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleDateString("en-MY")}</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                <Link href="/dashboard/quotations" className="flex items-center gap-1 text-sm text-primary hover:underline pt-1">
                  View all quotations <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </motion.div>

          {/* Cashback & Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div className="bg-primary text-white rounded-xl p-6">
              <div className="text-white/70 text-sm mb-1">Cashback Balance</div>
              {isLoading ? (
                <Skeleton className="h-9 w-28 bg-white/20" />
              ) : (
                <div className="text-3xl font-bold">RM {summary?.cashbackBalance?.toFixed(2) ?? "0.00"}</div>
              )}
              <div className="text-white/60 text-xs mt-1">Available to redeem</div>
              <Link href="/dashboard/cashback">
                <Button variant="outline" size="sm" className="mt-4 border-white/30 text-white hover:bg-white/10 h-8 text-xs">
                  View History
                </Button>
              </Link>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/dashboard/quotations/new">
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm" size="sm">
                    <Plus size={15} /> Request Quotation
                  </Button>
                </Link>
                <Link href="/dashboard/referrals">
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm" size="sm">
                    <Bell size={15} /> Share Referral Code
                  </Button>
                </Link>
                <Link href="/dashboard/cashback">
                  <Button variant="outline" className="w-full justify-start gap-2 h-9 text-sm" size="sm">
                    <Wallet size={15} /> Cashback Wallet
                  </Button>
                </Link>
              </div>
            </div>

            {summary && summary.unreadNotifications > 0 && (
              <Link href="/dashboard/notifications">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors">
                  <AlertCircle size={18} className="text-blue-600 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-blue-800">{summary.unreadNotifications} new notification{summary.unreadNotifications > 1 ? "s" : ""}</div>
                    <div className="text-xs text-blue-600">Click to view</div>
                  </div>
                </div>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
