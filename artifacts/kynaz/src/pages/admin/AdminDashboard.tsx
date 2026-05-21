import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetAdminStats, useListAdminQuotations } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users, FileText, Wallet, TrendingUp, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: allQuotations, isLoading: quotationsLoading } = useListAdminQuotations({});
  const pendingQuotations = allQuotations?.filter(q => q.status === "pending") ?? [];

  const statsCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/users" },
    { label: "Total Quotations", value: stats?.totalQuotations, icon: FileText, color: "text-primary", bg: "bg-primary/10", href: "/admin/quotations" },
    { label: "Pending Review", value: stats?.pendingQuotations, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/quotations" },
    { label: "Total Cashback Issued", value: stats?.totalCashbackIssued != null ? `RM ${stats.totalCashbackIssued.toFixed(2)}` : "RM 0.00", icon: Wallet, color: "text-secondary", bg: "bg-secondary/10", href: "/admin/cashback" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of Kynaz Enterprise portal activity</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={card.href}>
                <div data-testid={`stat-card-${card.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                  <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
                  {statsLoading ? <Skeleton className="h-7 w-20" /> : (
                    <div className="text-xl font-bold text-foreground">{card.value ?? "0"}</div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2"><Clock size={18} className="text-amber-500" /> Pending Quotations</h2>
              <Link href="/admin/quotations"><Button size="sm" variant="outline" className="h-8">View All <ArrowRight size={14} className="ml-1" /></Button></Link>
            </div>
            {quotationsLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : !pendingQuotations.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 size={32} className="mx-auto mb-3 opacity-30 text-emerald-500" />
                <p className="text-sm">No pending quotations — all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingQuotations.slice(0, 6).map(q => {
                  const status = statusConfig[q.status] ?? statusConfig.pending;
                  return (
                    <Link key={q.id} href={`/admin/quotations/${q.id}`}>
                      <div data-testid={`row-pending-quotation-${q.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                        <div>
                          <div className="font-medium text-sm text-foreground">{q.customerName ?? "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{q.serviceName} · {new Date(q.createdAt).toLocaleDateString("en-MY")}</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp size={17} className="text-secondary" /> This Month</h3>
              {statsLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "New Users", value: stats?.newUsersThisMonth ?? 0, color: "text-blue-600" },
                    { label: "Total Quotations", value: stats?.totalQuotations ?? 0, color: "text-primary" },
                    { label: "Pending", value: stats?.pendingQuotations ?? 0, color: "text-amber-600" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center p-2.5 bg-muted/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className={`font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-primary text-white rounded-xl p-5">
              <div className="text-white/70 text-xs mb-1">Total Cashback Issued</div>
              {statsLoading ? <Skeleton className="h-8 w-28 bg-white/20" /> : (
                <div className="text-2xl font-bold">RM {(stats?.totalCashbackIssued ?? 0).toFixed(2)}</div>
              )}
              <Link href="/admin/cashback">
                <Button variant="outline" size="sm" className="mt-3 border-white/30 text-white hover:bg-white/10 h-8 text-xs gap-1">
                  Manage <ArrowRight size={12} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
