import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp } from "lucide-react";

export default function AgentCommissions() {
  const { data: meData } = useQuery({
    queryKey: ["agent-me"],
    queryFn: () => customFetch<any>("/api/agents/me"),
  });

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["agent-commissions"],
    queryFn: () => customFetch<any[]>("/api/agents/commissions"),
  });

  const balance = meData?.stats?.commissionBalance ?? 0;
  const total = meData?.stats?.totalCommission ?? 0;

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Commission History</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your earned commissions and payouts</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={18} />
              <span className="text-sm font-medium opacity-80">Available Balance</span>
            </div>
            <div className="text-3xl font-bold">RM {balance.toFixed(2)}</div>
            <div className="text-white/60 text-xs mt-1">Pending withdrawal</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Earned</span>
            </div>
            <div className="text-3xl font-bold text-foreground">RM {total.toFixed(2)}</div>
            <div className="text-muted-foreground text-xs mt-1">All time commissions</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Commission Records</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <div className="text-center py-10">
              <Wallet size={36} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No commissions yet. Close your first sale to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map((c: any) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.description}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleDateString()} · {c.rate}% rate</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${c.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                      + RM {c.amount.toFixed(2)}
                    </div>
                    <div className={`text-xs capitalize ${c.status === "paid" ? "text-emerald-500" : "text-amber-500"}`}>{c.status}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          To withdraw your commission balance, please contact your administrator. Payouts are processed within 3–5 business days.
        </div>
      </div>
    </ProtectedLayout>
  );
}
