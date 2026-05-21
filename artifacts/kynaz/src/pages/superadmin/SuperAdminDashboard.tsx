import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ShieldCheck, Users, UserCog, Briefcase, Ban, TrendingUp, Wallet, FileText } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface SuperAdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalSuperAdmins: number;
  totalAgents: number;
  totalCustomers: number;
  totalSuspended: number;
  totalQuotations: number;
  totalActiveAgents: number;
  totalCashbackIssued: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kynaz_token");
    fetch("/api/superadmin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => { setStats(data as SuperAdminStats); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Super Admins", value: stats.totalSuperAdmins, icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Admins", value: stats.totalAdmins, icon: UserCog, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Active Agents", value: stats.totalActiveAgents, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Customers", value: stats.totalCustomers, icon: Users, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
    { label: "Suspended", value: stats.totalSuspended, icon: Ban, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
    { label: "Total Quotations", value: stats.totalQuotations, icon: FileText, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
    { label: "Cashback Issued", value: `RM ${stats.totalCashbackIssued.toFixed(2)}`, icon: Wallet, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  ] : [];

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-amber-500" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Super Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Full system oversight & user management</p>
          </div>
          <Badge className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/30">Restricted Access</Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-24 p-6" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon className={s.color} size={20} />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{s.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UserCog size={18} className="text-purple-500" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/superadmin/users">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users size={16} /> Manage All Users
                </Button>
              </Link>
              <Link href="/superadmin/users?role=admin">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <UserCog size={16} /> Manage Admins
                </Button>
              </Link>
              <Link href="/superadmin/users?role=agent">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Briefcase size={16} /> Manage Agents
                </Button>
              </Link>
              <Link href="/admin/infographics">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <TrendingUp size={16} /> View Infographics
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-50/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" /> Super Admin Privileges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Create & manage admin accounts",
                  "Promote users to agent or admin roles",
                  "Suspend or delete any account",
                  "Reset passwords for any user",
                  "View all system statistics",
                  "Access all portal areas",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
