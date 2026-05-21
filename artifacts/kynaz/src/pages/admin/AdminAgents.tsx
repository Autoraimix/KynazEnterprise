import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, CheckCircle, XCircle, Pause, Send, Search, Trophy, Settings2,
  Pencil, ChevronLeft, ChevronRight, Save, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const PAGE_SIZE = 10;

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

const BADGE_LABELS = ["bronze", "silver", "gold", "platinum", "elite"];

type Agent = {
  id: number; agentId: string; userId: number; status: string; badge: string;
  points: number; rankPosition: number; totalSales: number; totalSalesValue: number;
  totalCustomers: number; totalCommission: number; commissionBalance: number;
  commissionRate: number; notes: string | null; createdAt: string;
  user: { id: number; fullName: string; email: string; phone: string; referralCode: string } | null;
};

type BadgeCriteria = {
  bronze: { minSales: number; minValue: number };
  silver: { minSales: number; minValue: number };
  gold: { minSales: number; minValue: number };
  platinum: { minSales: number; minValue: number };
};

type CriteriaResp = { criteria: BadgeCriteria; pointsPerSale: number };

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function AdminAgents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState<{
    fullName: string; phone: string; status: string; badge: string;
    commissionRate: string; points: string; notes: string;
  }>({ fullName: "", phone: "", status: "active", badge: "bronze", commissionRate: "5", points: "0", notes: "" });
  const [showCriteria, setShowCriteria] = useState(false);
  const [criteriaForm, setCriteriaForm] = useState<BadgeCriteria & { pointsPerSale: number }>({
    bronze: { minSales: 8, minValue: 10000 },
    silver: { minSales: 12, minValue: 10000 },
    gold: { minSales: 16, minValue: 15000 },
    platinum: { minSales: 20, minValue: 20000 },
    pointsPerSale: 10,
  });
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const { data: agents, isLoading } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: () => customFetch<Agent[]>("/api/admin/agents"),
  });

  const { data: criteriaData } = useQuery({
    queryKey: ["badge-criteria"],
    queryFn: () => customFetch<CriteriaResp>("/api/admin/agents/badge-criteria"),
    onSuccess: (d: CriteriaResp) => {
      setCriteriaForm({ ...d.criteria, pointsPerSale: d.pointsPerSale });
    },
  } as any);

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, any> }) =>
      customFetch(`/api/admin/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agents"] });
      toast({ title: "Agent updated successfully" });
      setEditingAgent(null);
    },
    onError: () => toast({ title: "Failed to update agent", variant: "destructive" }),
  });

  const criteriaMutation = useMutation({
    mutationFn: (body: { criteria: BadgeCriteria; pointsPerSale: number }) =>
      customFetch("/api/admin/agents/badge-criteria", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badge-criteria"] });
      toast({ title: "Badge criteria saved" });
      setShowCriteria(false);
    },
    onError: () => toast({ title: "Failed to save criteria", variant: "destructive" }),
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

  const openEdit = (a: Agent) => {
    setEditingAgent(a);
    setEditForm({
      fullName: a.user?.fullName ?? "",
      phone: a.user?.phone ?? "",
      status: a.status,
      badge: a.badge,
      commissionRate: String(a.commissionRate),
      points: String(a.points),
      notes: a.notes ?? "",
    });
  };

  const saveCriteria = () => {
    const { pointsPerSale, ...criteria } = criteriaForm;
    criteriaMutation.mutate({ criteria, pointsPerSale });
  };

  const filtered = (agents ?? []).filter((a: Agent) => {
    const name = a.user?.fullName?.toLowerCase() ?? "";
    const email = a.user?.email?.toLowerCase() ?? "";
    const matchSearch = name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || a.agentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(0); };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Agent Management</h1>
            <p className="text-muted-foreground text-sm mt-1">{agents?.length ?? 0} total agents · ranked by badge → sales → points</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowCriteria(!showCriteria)} className="gap-2">
              <Settings2 size={14} /> Badge Criteria
            </Button>
            <Button variant="outline" size="sm" onClick={() => refreshRankings.mutate()} className="gap-2">
              <Trophy size={14} /> Refresh Rankings
            </Button>
            <Button size="sm" onClick={() => setShowBroadcast(!showBroadcast)} className="gap-2">
              <Send size={14} /> Broadcast
            </Button>
          </div>
        </motion.div>

        {/* Badge Criteria Panel */}
        {showCriteria && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Badge Criteria Settings</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowCriteria(false)}><X size={16} /></Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Set minimum sales count and total sales value (RM) required to achieve each badge level.</p>
            <div className="space-y-3">
              {(["bronze", "silver", "gold", "platinum"] as const).map(badge => (
                <div key={badge} className="grid grid-cols-3 gap-3 items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize w-fit ${BADGE_COLORS[badge]}`}>{badge}</span>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Min. Sales Count</div>
                    <input
                      type="number" min={0}
                      value={criteriaForm[badge].minSales}
                      onChange={e => setCriteriaForm(f => ({ ...f, [badge]: { ...f[badge], minSales: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Min. Sales Value (RM)</div>
                    <input
                      type="number" min={0}
                      value={criteriaForm[badge].minValue}
                      onChange={e => setCriteriaForm(f => ({ ...f, [badge]: { ...f[badge], minValue: parseInt(e.target.value) || 0 } }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-sm font-medium text-foreground">Points per Sale:</span>
                <input
                  type="number" min={1}
                  value={criteriaForm.pointsPerSale}
                  onChange={e => setCriteriaForm(f => ({ ...f, pointsPerSale: parseInt(e.target.value) || 1 }))}
                  className="w-24 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={saveCriteria} disabled={criteriaMutation.isPending} className="gap-2">
                <Save size={14} /> {criteriaMutation.isPending ? "Saving..." : "Save Criteria"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCriteria(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}

        {/* Broadcast Panel */}
        {showBroadcast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border border-primary/20 rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Send Broadcast to All Agents</h3>
            <div className="space-y-3">
              <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="Title..." className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none" />
              <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Message..." rows={3} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none resize-none" />
              <div className="flex gap-2">
                <Button size="sm" className="gap-2" disabled={!broadcastTitle || !broadcastMsg || broadcastMutation.isPending} onClick={() => broadcastMutation.mutate({ title: broadcastTitle, message: broadcastMsg })}>
                  <Send size={14} /> {broadcastMutation.isPending ? "Sending..." : "Send Broadcast"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowBroadcast(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search agents..." className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <select value={statusFilter} onChange={e => handleStatus(e.target.value)} className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:outline-none">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Agent List */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : paginated.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users size={40} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No agents found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((a: Agent) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => openEdit(a)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                        {a.rankPosition && a.rankPosition <= 3 ? (
                          <span className="text-lg">{RANK_ICONS[a.rankPosition]}</span>
                        ) : (
                          <span>#{a.rankPosition ?? "—"}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{a.user?.fullName ?? "Unknown"}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] ?? "bg-muted"}`}>{a.status}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BADGE_COLORS[a.badge] ?? "bg-muted"}`}>{a.badge}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{a.agentId} · {a.user?.email}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {a.totalCustomers} customers · {a.totalSales} sales · RM {a.totalSalesValue?.toFixed(2) ?? "0.00"} sales value · {a.points} pts
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
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
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(a)}>
                        <Pencil size={14} /> Edit
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
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

      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={open => { if (!open) setEditingAgent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Agent</DialogTitle>
            <DialogDescription>
              {editingAgent?.agentId} · Rank #{editingAgent?.rankPosition ?? "—"}
            </DialogDescription>
          </DialogHeader>

          {editingAgent && (
            <div className="space-y-4 mt-1">
              <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-lg p-3">
                <div><span className="text-muted-foreground text-xs">Email</span><div className="font-medium truncate">{editingAgent.user?.email}</div></div>
                <div><span className="text-muted-foreground text-xs">Ref. Code</span><div className="font-medium">{editingAgent.user?.referralCode}</div></div>
                <div><span className="text-muted-foreground text-xs">Total Sales</span><div className="font-medium">{editingAgent.totalSales} (RM {editingAgent.totalSalesValue?.toFixed(2)})</div></div>
                <div><span className="text-muted-foreground text-xs">Commission Balance</span><div className="font-medium text-primary">RM {editingAgent.commissionBalance.toFixed(2)}</div></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                  <input value={editForm.fullName} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none">
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Badge (Manual Override)</label>
                  <select value={editForm.badge} onChange={e => setEditForm(f => ({ ...f, badge: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none">
                    {BADGE_LABELS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Commission Rate (%)</label>
                  <input type="number" min={0} max={100} step={0.5} value={editForm.commissionRate} onChange={e => setEditForm(f => ({ ...f, commissionRate: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Points (Manual Set)</label>
                  <input type="number" min={0} value={editForm.points} onChange={e => setEditForm(f => ({ ...f, points: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Admin Notes</label>
                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Internal notes..." className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditingAgent(null)}>
                  <X size={15} /> Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-primary text-white"
                  disabled={patchMutation.isPending}
                  onClick={() => patchMutation.mutate({ id: editingAgent.id, body: {
                    fullName: editForm.fullName,
                    phone: editForm.phone,
                    status: editForm.status,
                    badge: editForm.badge,
                    commissionRate: editForm.commissionRate,
                    points: editForm.points,
                    notes: editForm.notes,
                  }})}
                >
                  <Save size={15} /> {patchMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  );
}
