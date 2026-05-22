import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminCashback, useAddCashback, getListAdminCashbackQueryKey, customFetch } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, TrendingUp, TrendingDown, Gift, ArrowUpRight, ArrowDownRight, Percent, Save, Search, Info, Banknote, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";

const adjustSchema = z.object({
  userId: z.coerce.number().int().min(1, "Please select a user"),
  amount: z.coerce.number().min(0.01, "Amount must be > 0"),
  type: z.enum(["earned", "redeemed", "adjusted", "promotion"]),
  description: z.string().min(3, "Description required"),
});
type AdjustData = z.infer<typeof adjustSchema>;

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; desc: string }> = {
  earned: { label: "Earned", icon: ArrowUpRight, color: "text-emerald-600", desc: "Add cashback to the user's wallet (e.g. reward for a purchase)" },
  redeemed: { label: "Deduct", icon: ArrowDownRight, color: "text-red-500", desc: "Deduct cashback from the user's wallet (e.g. manual redemption)" },
  adjusted: { label: "Correction", icon: ArrowUpRight, color: "text-blue-500", desc: "Correct an error in the user's cashback balance" },
  promotion: { label: "Promotion", icon: TrendingUp, color: "text-purple-500", desc: "Award promotional cashback for campaigns or special events" },
};

const WD_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

type Tab = "transactions" | "adjustment" | "withdrawals";

export default function AdminCashback() {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const { data: transactions, isLoading } = useListAdminCashback();
  const addCashbackMutation = useAddCashback();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cashbackRate, setCashbackRate] = useState<number>(5);
  const [rateInput, setRateInput] = useState("5");
  const [loadingRate, setLoadingRate] = useState(true);
  const [savingRate, setSavingRate] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ id: number; fullName: string; email: string } | null>(null);
  const [processingWd, setProcessingWd] = useState<number | null>(null);
  const [wdNotes, setWdNotes] = useState<Record<number, string>>({});

  const { data: allUsers } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: () => customFetch<any[]>("/api/admin/users"),
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: () => customFetch<any[]>("/api/admin/withdrawals"),
  });

  useEffect(() => {
    customFetch<{ rate: number }>("/api/admin/settings/cashback-rate")
      .then(data => { setCashbackRate(data.rate); setRateInput(String(data.rate)); })
      .catch(() => {})
      .finally(() => setLoadingRate(false));
  }, []);

  const handleSaveRate = async () => {
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      toast({ title: "Invalid rate", description: "Enter a number between 0 and 100.", variant: "destructive" });
      return;
    }
    setSavingRate(true);
    try {
      const data = await customFetch<{ rate: number }>("/api/admin/settings/cashback-rate", {
        method: "POST",
        body: JSON.stringify({ rate: parsed }),
      });
      setCashbackRate(data.rate);
      setRateInput(String(data.rate));
      toast({ title: "Cashback rate saved!", description: `New rate: ${data.rate}% of quotation price.` });
    } catch {
      toast({ title: "Error", description: "Failed to save cashback rate.", variant: "destructive" });
    } finally {
      setSavingRate(false);
    }
  };

  const form = useForm<AdjustData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { userId: 0, amount: 0, type: "earned", description: "" },
  });

  const onAdjust = (data: AdjustData) => {
    addCashbackMutation.mutate({
      data: { userId: data.userId, amount: data.amount, type: data.type, description: data.description }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminCashbackQueryKey() });
        toast({ title: "Cashback adjusted!", description: `${typeConfig[data.type]?.label} applied to ${selectedUser?.fullName ?? `User #${data.userId}`}.` });
        form.reset({ userId: 0, amount: 0, type: "earned", description: "" });
        setSelectedUser(null);
        setUserSearch("");
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to adjust cashback.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    });
  };

  const handleWdAction = async (id: number, status: "approved" | "completed" | "rejected") => {
    setProcessingWd(id);
    try {
      await customFetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, adminNotes: wdNotes[id] ?? "" }),
      });
      toast({ title: `Withdrawal ${status}`, description: `Request has been marked as ${status}.` });
      refetchWithdrawals();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed to update withdrawal.", variant: "destructive" });
    } finally {
      setProcessingWd(null);
    }
  };

  const filteredUsers = (allUsers ?? []).filter((u: any) =>
    userSearch.length >= 2 &&
    (u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(userSearch.toLowerCase()))
  ).slice(0, 8);

  const watchedType = form.watch("type");
  const totalEarned = transactions?.filter(t => t.type !== "redeemed").reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const totalRedeemed = transactions?.filter(t => t.type === "redeemed").reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const pendingWd = (withdrawals ?? []).filter((w: any) => w.status === "pending").length;

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Cashback Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage cashback rates, balances, and withdrawal requests</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">Cashback Rate Setting</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Set the cashback percentage applied to the quotation price when a payment is verified and marked as "Paid".
          </p>
          {loadingRate ? <Skeleton className="h-12 w-64 rounded-xl" /> : (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Input type="number" step="0.1" min="0" max="100" value={rateInput} onChange={e => setRateInput(e.target.value)} className="w-32 pr-8" placeholder="5.0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">%</span>
              </div>
              <Button onClick={handleSaveRate} disabled={savingRate} className="bg-primary text-white gap-2">
                <Save size={15} />
                {savingRate ? "Saving..." : "Save Rate"}
              </Button>
              <div className="text-sm text-muted-foreground">
                Current: <span className="font-semibold text-foreground">{cashbackRate}%</span> of quotation price per verified payment
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Total Transactions", value: String(transactions?.length ?? 0), icon: Wallet, bg: "bg-primary/10", color: "text-primary" },
            { label: "Total Issued", value: `RM ${totalEarned.toFixed(2)}`, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
            { label: "Pending Withdrawals", value: String(pendingWd), icon: Banknote, bg: "bg-amber-50", color: "text-amber-600" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
              <div className="text-xs text-muted-foreground mb-1">{card.label}</div>
              {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-xl font-bold text-foreground">{card.value}</div>}
            </motion.div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="flex border-b border-border">
            {(["transactions", "adjustment", "withdrawals"] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "transactions" ? "Transactions" : tab === "adjustment" ? "Manual Adjustment" : (
                  <span className="flex items-center justify-center gap-1.5">
                    Withdrawal Requests
                    {pendingWd > 0 && <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pendingWd}</span>}
                  </span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "transactions" && (
            <div className="p-6">
              <h2 className="font-semibold text-foreground mb-5">Recent Transactions</h2>
              {isLoading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : !transactions?.length ? (
                <div className="text-center py-8 text-muted-foreground"><Wallet size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No transactions yet.</p></div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {[...transactions].reverse().map((tx, i) => {
                    const config = typeConfig[tx.type] ?? typeConfig.earned;
                    const isPositive = tx.type !== "redeemed";
                    return (
                      <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        data-testid={`row-transaction-${tx.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? "bg-emerald-100" : "bg-red-100"}`}>
                            <config.icon size={15} className={config.color} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{tx.description}</div>
                            <div className="text-xs text-muted-foreground">{config.label} · User #{tx.userId}{tx.userName ? ` (${tx.userName})` : ""} · {new Date(tx.createdAt).toLocaleDateString("en-MY")}</div>
                          </div>
                        </div>
                        <div className={`font-semibold text-sm shrink-0 ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                          {isPositive ? "+" : "-"}RM {Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "adjustment" && (
            <div className="p-6 max-w-lg">
              <h2 className="font-semibold text-foreground mb-2">Manual Adjustment</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5 flex gap-3">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 space-y-1">
                  <p className="font-medium">What is Manual Adjustment?</p>
                  <p>Use this to directly credit or debit a customer's cashback wallet outside the normal transaction flow. For example:</p>
                  <ul className="mt-1 space-y-0.5 text-blue-600">
                    <li>• <strong>Earned</strong> — Add cashback as a reward or manual credit</li>
                    <li>• <strong>Deduct</strong> — Remove cashback for refunds or corrections</li>
                    <li>• <strong>Correction</strong> — Fix errors in the cashback balance</li>
                    <li>• <strong>Promotion</strong> — Give special campaign cashback</li>
                  </ul>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAdjust)} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Search Customer</label>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Type name or email to search..."
                        value={userSearch}
                        onChange={e => { setUserSearch(e.target.value); if (selectedUser) { setSelectedUser(null); form.setValue("userId", 0); } }}
                        className="pl-9"
                      />
                    </div>
                    {selectedUser ? (
                      <div className="mt-2 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-sm font-medium text-foreground">{selectedUser.fullName}</div>
                          <div className="text-xs text-muted-foreground">{selectedUser.email} · ID #{selectedUser.id}</div>
                        </div>
                        <button type="button" onClick={() => { setSelectedUser(null); setUserSearch(""); form.setValue("userId", 0); }}
                          className="text-xs text-red-500 hover:underline">Change</button>
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      <div className="mt-1 border border-border rounded-lg overflow-hidden shadow-sm">
                        {filteredUsers.map((u: any) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => { setSelectedUser({ id: u.id, fullName: u.fullName, email: u.email }); setUserSearch(u.fullName); form.setValue("userId", u.id); }}
                            className="w-full px-4 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                          >
                            <div className="text-sm font-medium text-foreground">{u.fullName}</div>
                            <div className="text-xs text-muted-foreground">{u.email} · #{u.id}</div>
                          </button>
                        ))}
                      </div>
                    ) : userSearch.length >= 2 ? (
                      <p className="text-xs text-muted-foreground mt-1.5 ml-1">No users found.</p>
                    ) : null}
                    {form.formState.errors.userId && (
                      <p className="text-xs text-red-500 mt-1">{form.formState.errors.userId.message}</p>
                    )}
                  </div>

                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {(["earned", "redeemed", "adjusted", "promotion"] as const).map(t => (
                            <SelectItem key={t} value={t}>{typeConfig[t]?.label ?? t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {watchedType && typeConfig[watchedType] && (
                        <p className="text-xs text-muted-foreground mt-1">{typeConfig[watchedType].desc}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (RM)</FormLabel>
                      <FormControl><Input data-testid="input-amount" type="number" step="0.01" min="0.01" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description / Reason</FormLabel>
                      <FormControl><Input data-testid="input-description" placeholder="Reason for adjustment..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button data-testid="button-adjust" type="submit" disabled={addCashbackMutation.isPending} className="w-full bg-primary text-white h-11">
                    {addCashbackMutation.isPending ? "Processing..." : "Apply Adjustment"}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {activeTab === "withdrawals" && (
            <div className="p-6">
              <h2 className="font-semibold text-foreground mb-2">Withdrawal Requests</h2>
              <p className="text-sm text-muted-foreground mb-5">Review and process cashback/commission withdrawal requests from customers and agents.</p>
              {!withdrawals ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Banknote size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No withdrawal requests yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w: any) => (
                    <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-foreground">{w.user?.fullName ?? `User #${w.userId}`}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${WD_STATUS_COLORS[w.status] ?? "bg-muted text-muted-foreground"}`}>{w.status}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">{w.requestType}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{w.user?.email} · {new Date(w.createdAt).toLocaleDateString("en-MY")}</div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Bank: </span><span className="font-medium">{w.bankName}</span>
                            <span className="text-muted-foreground ml-3">Account: </span><span className="font-medium">{w.accountName} ({w.accountNumber})</span>
                          </div>
                          {w.adminNotes && <div className="text-xs text-muted-foreground mt-1">Note: {w.adminNotes}</div>}
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xl font-bold text-foreground">RM {parseFloat(w.amount).toFixed(2)}</div>
                        </div>
                      </div>

                      {w.status === "pending" && (
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          <Input
                            placeholder="Admin notes (optional)"
                            value={wdNotes[w.id] ?? ""}
                            onChange={e => setWdNotes(n => ({ ...n, [w.id]: e.target.value }))}
                            className="text-sm h-8"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleWdAction(w.id, "approved")} disabled={processingWd === w.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 flex-1">
                              <CheckCircle2 size={14} /> Approve
                            </Button>
                            <Button size="sm" onClick={() => handleWdAction(w.id, "completed")} disabled={processingWd === w.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 flex-1">
                              <Banknote size={14} /> Mark Completed
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleWdAction(w.id, "rejected")} disabled={processingWd === w.id}
                              className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5 flex-1">
                              <XCircle size={14} /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                      {w.status === "approved" && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <Button size="sm" onClick={() => handleWdAction(w.id, "completed")} disabled={processingWd === w.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                            <Banknote size={14} /> Confirm Bank Transfer Completed
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
