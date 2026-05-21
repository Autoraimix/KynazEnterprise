import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, FileText, Wallet, Star, PieChart as PieChartIcon } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  quotationsByMonth: { month: string; total: number; paid: number; revenue: number }[];
  registrationsByMonth: { month: string; count: number }[];
  quotationStatusBreakdown: { status: string; count: number }[];
  servicePopularity: { service: string; count: number }[];
  topAgents: { name: string; agentId: string; sales: number; customers: number; commission: number; badge: string; points: number }[];
  cashbackByMonth: { month: string; amount: number }[];
  roleCounts: { customer: number; agent: number; admin: number };
  agentClosedQuotations: { name: string; closed: number; agentId: string }[];
  summary: { totalQuotations: number; totalPaid: number; totalRevenue: number; totalCustomers: number; totalAgents: number; totalCashback: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", ready: "#8b5cf6",
  approved: "#10b981", rejected: "#ef4444", expired: "#6b7280", paid: "#059669",
};

const CHART_COLORS = ["#0d1f3c", "#c9a84c", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"];

const BADGE_COLORS: Record<string, string> = {
  bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700", platinum: "#e5e4e2", elite: "#b9f2ff",
};

export default function AdminInfographics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("kynaz_token");
    fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d as AnalyticsData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-serif font-bold text-foreground">Infographics</h1>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-64" /></Card>)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-24 text-muted-foreground">Failed to load analytics data.</div>
      </AdminLayout>
    );
  }

  const summaryCards = [
    { label: "Total Quotations", value: data.summary.totalQuotations, icon: FileText, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Paid Quotations", value: data.summary.totalPaid, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { label: "Total Revenue", value: `RM ${data.summary.totalRevenue.toFixed(2)}`, icon: Wallet, color: "text-gold-500", bg: "bg-yellow-50 dark:bg-yellow-950/30" },
    { label: "Total Customers", value: data.summary.totalCustomers, icon: Users, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950/30" },
    { label: "Active Agents", value: data.summary.totalAgents, icon: Star, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
    { label: "Total Cashback", value: `RM ${data.summary.totalCashback.toFixed(2)}`, icon: Wallet, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="text-primary" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Infographics</h1>
            <p className="text-muted-foreground text-sm">System-wide analytics and performance metrics</p>
          </div>
        </div>

        {/* Summary KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <Icon className={s.color} size={16} />
                    </div>
                    <div className="text-lg font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly quotations & revenue */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp size={18} className="text-blue-500" /> Monthly Quotations & Revenue</CardTitle>
                <CardDescription>Last 12 months — total vs paid quotations with revenue (RM)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.quotationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="paid" stroke="#10b981" name="Paid" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#c9a84c" name="Revenue (RM)" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Customer registrations */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users size={18} className="text-purple-500" /> Customer Registrations</CardTitle>
                <CardDescription>New customer sign-ups per month over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.registrationsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Registrations" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quotation status breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><PieChartIcon size={18} className="text-amber-500" /> Quotation Status Breakdown</CardTitle>
                <CardDescription>Distribution of all quotations by their current status</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-4 flex-wrap">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={data.quotationStatusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={false}>
                      {data.quotationStatusBreakdown.map((entry, i) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 text-xs">
                  {data.quotationStatusBreakdown.map(item => (
                    <div key={item.status} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLORS[item.status] ?? "#888" }} />
                      <span className="capitalize text-foreground font-medium">{item.status}</span>
                      <span className="text-muted-foreground ml-auto pl-4">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service popularity */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 size={18} className="text-cyan-500" /> Service Popularity</CardTitle>
                <CardDescription>Most requested services by total quotation count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.servicePopularity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="service" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" name="Quotations" radius={[0, 4, 4, 0]}>
                      {data.servicePopularity.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top agents leaderboard */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Star size={18} className="text-amber-500" /> Top Agents by Sales</CardTitle>
                <CardDescription>Ranking of agents by total paid sales and commissions earned</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topAgents.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No agent data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.topAgents.slice(0, 6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sales" fill="#c9a84c" name="Total Sales" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="customers" fill="#0d1f3c" name="Customers" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Cashback issued */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Wallet size={18} className="text-emerald-500" /> Cashback Issued (RM)</CardTitle>
                <CardDescription>Total cashback earned and credited to customers per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.cashbackByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" name="Cashback (RM)" strokeWidth={2} fill="#10b98133" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Agents who closed quotations */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FileText size={18} className="text-indigo-500" /> Quotations Closed by Agent</CardTitle>
                <CardDescription>Number of paid (completed) quotations attributed to each agent</CardDescription>
              </CardHeader>
              <CardContent>
                {data.agentClosedQuotations.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No closed quotations linked to agents yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.agentClosedQuotations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="closed" fill="#6366f1" name="Closed Quotations" radius={[4, 4, 0, 0]}>
                        {data.agentClosedQuotations.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
