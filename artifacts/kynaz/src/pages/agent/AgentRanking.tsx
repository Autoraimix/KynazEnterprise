import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const BADGE_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700 border-amber-200",
  silver: "bg-gray-100 text-gray-600 border-gray-200",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
  platinum: "bg-sky-100 text-sky-700 border-sky-200",
  elite: "bg-purple-100 text-purple-700 border-purple-200",
};

const BADGE_ICONS: Record<string, string> = {
  bronze: "🏅",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  elite: "👑",
};

const PODIUM_ORDER = [1, 0, 2]; // visual order: 2nd, 1st, 3rd
const PAGE_SIZE = 10;

export default function AgentRanking() {
  const [page, setPage] = useState(0);

  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ["agent-leaderboard"],
    queryFn: () => customFetch<any[]>("/api/agents/leaderboard"),
    refetchInterval: 120_000,
  });

  const top3 = (leaderboard ?? []).slice(0, 3);
  const rest = (leaderboard ?? []).slice(3);
  const total = rest.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paginated = rest.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const podiumHeights = ["h-28", "h-36", "h-24"]; // visual heights: 2nd, 1st, 3rd
  const podiumBorders = [
    "border-gray-300 bg-gradient-to-b from-gray-50 to-white",
    "border-secondary bg-gradient-to-b from-yellow-50 to-white ring-2 ring-secondary/30",
    "border-amber-300 bg-gradient-to-b from-amber-50 to-white",
  ];

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Agent Leaderboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Rankings refresh automatically every 2 minutes</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <Trophy size={14} />
            Refresh
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (leaderboard ?? []).length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No active agents on the leaderboard yet.</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Crown size={18} className="text-secondary" />
                  <h2 className="font-semibold text-foreground">Top Performers</h2>
                </div>
                <div className="flex items-end justify-center gap-3">
                  {PODIUM_ORDER.map((arrIdx) => {
                    const agent = top3[arrIdx];
                    if (!agent) return <div key={arrIdx} className="flex-1 max-w-[160px]" />;
                    const visualIdx = arrIdx === 0 ? 1 : arrIdx === 1 ? 0 : 2;
                    const rankNum = agent.rank;
                    const rankEmoji = rankNum === 1 ? "🥇" : rankNum === 2 ? "🥈" : "🥉";
                    const badgeClass = BADGE_COLORS[agent.badge] ?? "bg-muted text-muted-foreground border-border";
                    const badgeIcon = BADGE_ICONS[agent.badge] ?? "";
                    return (
                      <motion.div
                        key={agent.agentId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: visualIdx * 0.1 }}
                        className="flex-1 max-w-[160px] flex flex-col items-center"
                      >
                        <div className="text-center mb-2">
                          <div className="text-3xl mb-1">{rankEmoji}</div>
                          <div className="font-semibold text-sm text-foreground text-center leading-tight line-clamp-2">{agent.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{agent.agentId}</div>
                          <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${badgeClass}`}>
                            {badgeIcon} {agent.badge}
                          </span>
                        </div>
                        <div className={`w-full border-2 rounded-t-xl flex flex-col items-center justify-end pb-3 px-2 ${podiumHeights[visualIdx]} ${podiumBorders[visualIdx]}`}>
                          <div className="font-bold text-primary text-sm">{agent.points.toLocaleString()} pts</div>
                          <div className="text-xs text-muted-foreground">{agent.totalSales} sales</div>
                        </div>
                        <div className="w-full bg-muted/60 rounded-b-sm h-3 flex items-center justify-center">
                          <span className="text-xs font-bold text-muted-foreground">#{rankNum}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {paginated.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground px-1">All Rankings (from #4)</h3>
                {paginated.map((agent: any, idx: number) => {
                  const actualRank = 3 + page * PAGE_SIZE + idx + 1;
                  const badgeClass = BADGE_COLORS[agent.badge] ?? "bg-muted text-muted-foreground border-border";
                  const badgeIcon = BADGE_ICONS[agent.badge] ?? "";
                  return (
                    <motion.div
                      key={agent.agentId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0 text-muted-foreground">
                        #{actualRank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{agent.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${badgeClass}`}>
                            {badgeIcon} {agent.badge}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{agent.agentId}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-lg text-primary">{agent.points.toLocaleString()} pts</div>
                        <div className="text-xs text-muted-foreground">{agent.totalSales} sales · {agent.totalCustomers} customers</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft size={16} /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedLayout>
  );
}
