import { AdminLayout } from "@/components/layout/AdminLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const BADGE_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700 border-amber-200",
  silver: "bg-gray-100 text-gray-600 border-gray-200",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  platinum: "bg-sky-100 text-sky-700 border-sky-200",
  elite: "bg-purple-100 text-purple-700 border-purple-200",
};

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const PAGE_SIZE = 10;

export default function AdminLeaderboard() {
  const [page, setPage] = useState(0);

  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ["admin-leaderboard"],
    queryFn: () => customFetch<any[]>("/api/agents/leaderboard"),
    refetchInterval: 120_000,
  });

  const total = leaderboard?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = (leaderboard ?? []).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Trophy size={22} className="text-yellow-500" /> Agent Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ranked by badge tier → total sales → points · refreshes every 2 minutes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <BarChart2 size={14} /> Refresh
          </Button>
        </motion.div>

        {/* Top 3 cards */}
        {!isLoading && (leaderboard ?? []).length >= 1 && (
          <div className="grid sm:grid-cols-3 gap-4">
            {(leaderboard ?? []).slice(0, 3).map((agent: any, idx: number) => {
              const rank = idx + 1;
              const badgeClass = BADGE_COLORS[agent.badge] ?? "bg-muted text-muted-foreground border-border";
              return (
                <motion.div key={agent.agentId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                  className={`bg-card border rounded-xl p-5 text-center ${rank === 1 ? "border-yellow-300 bg-yellow-50/40" : rank === 2 ? "border-gray-300 bg-gray-50/40" : "border-amber-200 bg-amber-50/30"}`}
                >
                  <div className="text-3xl mb-2">{RANK_ICONS[rank]}</div>
                  <div className="font-bold text-foreground">{agent.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{agent.agentId}</div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${badgeClass}`}>{agent.badge}</span>
                  <div className="mt-3 text-2xl font-bold text-primary">{agent.points.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                  <div className="mt-1 text-xs text-muted-foreground">{agent.totalSales} sales · RM {agent.totalSalesValue?.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : total === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No active agents on the leaderboard yet.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginated.map((agent: any, idx: number) => {
                const actualRank = page * PAGE_SIZE + idx + 1;
                const isTop3 = actualRank <= 3;
                const badgeClass = BADGE_COLORS[agent.badge] ?? "bg-muted text-muted-foreground border-border";
                return (
                  <motion.div key={agent.agentId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                    className={`bg-card border rounded-xl p-4 flex items-center gap-4 ${isTop3 ? "border-primary/30 bg-primary/5" : "border-border"}`}
                  >
                    <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0">
                      {RANK_ICONS[actualRank] ?? `#${actualRank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{agent.name}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${badgeClass}`}>{agent.badge}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{agent.agentId} · {agent.totalCustomers} customers</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-lg text-primary">{agent.points.toLocaleString()} pts</div>
                      <div className="text-xs text-muted-foreground">{agent.totalSales} sales · RM {agent.totalSalesValue?.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} agents
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                    <ChevronLeft size={16} /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
