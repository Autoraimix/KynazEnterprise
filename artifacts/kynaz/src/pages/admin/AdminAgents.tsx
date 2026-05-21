import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle, XCircle, Pause, Send, Search, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
};

const BADGE_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700",
  silver: "bg-gray-100 text-gray-600",
  gold: "bg-yellow-100 text-yellow-700",
  platinum: "bg-sky-100 text-sky-700",
  elite: "bg-purple-100 text-purple-700",
};

export default function AdminAgents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);

  const { data: agents, isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => customFetch<any[]>("/api/admin/agents"),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, any> }) =>
      customFetch(`/api/admin/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      toast({ title: "Agent updated successfully" });
    },
    onError: () => toast({ title: "Failed to update agent", variant: "destructive" }),
  });

  const refreshRankings = useMutation({
    mutationFn: () => customFetch("/api/admin/agents/refresh-rankings", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      toast({ title: "Rankings refreshed" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (body: { title: string; message: string }) =>
      customFetch("/api/admin/agents/broadcast", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast({ title: "Broadcast sent to all active agents" });
      setBroadcastTitle(""); setBroadcastMsg(""); setShowBroadcast(false);
    },
    onError: () => toast({ title: "Failed to send broadcast", variant: "destructive" }),
  });

  const filtered = (agents ?? []).filter((a: any) => {
    const name = a.user?.fullName?.toLowerCase() ?? "";
    const email = a.user?.email?.toLowerCase() ?? "";
    const matchSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || a.agentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Agent Management</h1>
            <p className="text-muted-foreground text-sm mt-1">{agents?.length ?? 0} total agents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refreshRankings.mutate()} className="gap-2">
              <Trophy size={14} /> Refresh Rankings
            </Button>
            <Button size="sm" onClick={() => setShowBroadcast(!showBroadcast)} className="gap-2">
              <Send size={14} /> Broadcast
            </Button>
          </div>
        </motion.div>

        {showBroadcast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Send Broadcast to All Agents</h3>
            <div className="space-y-3">
              <input
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="Title..."
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                value={broadcastMsg}
                onChange={e => setBroadcastMsg(e.target.value)}
                placeholder="Message..."
                rows={3}
                className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm" className="gap-2"
                  disabled={!broadcastTitle || !broadcastMsg || broadcastMutation.isPending}
                  onClick={() => broadcastMutation.mutate({ title: broadcastTitle, message: broadcastMsg })}
                >
                  <Send size={14} /> {broadcastMutation.isPending ? "Sending..." : "Send Broadcast"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowBroadcast(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No agents found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a: any) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                        {a.user?.fullName?.charAt(0) ?? "A"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{a.user?.fullName ?? "Unknown"}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? "bg-muted"}`}>{a.status}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BADGE_COLORS[a.badge] ?? "bg-muted"}`}>{a.badge}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{a.agentId} · {a.user?.email}</div>
                        <div className="text-xs text-muted-foreground">{a.user?.referralCode} · {a.totalCustomers} customers · {a.totalSales} sales · RM {a.totalCommission.toFixed(2)} earned</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status === "pending" && (
                        <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => patchMutation.mutate({ id: a.id, body: { status: "active" } })}>
                          <CheckCircle size={14} /> Approve
                        </Button>
                      )}
                      {a.status === "active" && (
                        <Button size="sm" variant="outline" className="gap-1 text-amber-600 border-amber-300" onClick={() => patchMutation.mutate({ id: a.id, body: { status: "suspended" } })}>
                          <Pause size={14} /> Suspend
                        </Button>
                      )}
                      {a.status === "suspended" && (
                        <Button size="sm" variant="outline" className="gap-1 text-emerald-600 border-emerald-300" onClick={() => patchMutation.mutate({ id: a.id, body: { status: "active" } })}>
                          <CheckCircle size={14} /> Reactivate
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                        {expandedId === a.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </Button>
                    </div>
                  </div>
                </div>

                {expandedId === a.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-5 pb-5 border-t border-border pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Commission Rate (%)</div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            defaultValue={a.commissionRate}
                            id={`rate-${a.id}`}
                            min={0} max={100} step={0.5}
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                          />
                          <Button size="sm" variant="outline" onClick={() => {
                            const el = document.getElementById(`rate-${a.id}`) as HTMLInputElement;
                            patchMutation.mutate({ id: a.id, body: { commissionRate: el.value } });
                          }}>Update</Button>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Commission Balance</div>
                        <div className="font-bold text-lg">RM {a.commissionBalance.toFixed(2)}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Admin Notes</div>
                        <div className="flex gap-2">
                          <input
                            id={`notes-${a.id}`}
                            defaultValue={a.notes ?? ""}
                            placeholder="Add internal notes..."
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                          />
                          <Button size="sm" variant="outline" onClick={() => {
                            const el = document.getElementById(`notes-${a.id}`) as HTMLInputElement;
                            patchMutation.mutate({ id: a.id, body: { notes: el.value } });
                          }}>Save</Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
