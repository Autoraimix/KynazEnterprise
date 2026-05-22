import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { motion } from "framer-motion";
import { customFetch } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, TrendingUp, Banknote, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

const withdrawSchema = z.object({
  amount: z.coerce.number().min(50, "Minimum withdrawal is RM50"),
  bankName: z.string().min(2, "Bank name required"),
  accountName: z.string().min(2, "Account holder name required"),
  accountNumber: z.string().min(5, "Account number required"),
});
type WithdrawData = z.infer<typeof withdrawSchema>;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AgentCommissions() {
  const [page, setPage] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meData } = useQuery({
    queryKey: ["agent-me"],
    queryFn: () => customFetch<any>("/api/agents/me"),
  });

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["agent-commissions"],
    queryFn: () => customFetch<any[]>("/api/agents/commissions"),
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["agent-withdrawals"],
    queryFn: () => customFetch<any[]>("/api/agents/commissions/withdrawals"),
  });

  const balance = meData?.stats?.commissionBalance ?? 0;
  const total = meData?.stats?.totalCommission ?? 0;
  const canWithdraw = balance >= 50;

  const totalPages = Math.max(1, Math.ceil((commissions?.length ?? 0) / PAGE_SIZE));
  const paginated = (commissions ?? []).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const form = useForm<WithdrawData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: 50, bankName: "", accountName: "", accountNumber: "" },
  });

  const onWithdraw = async (data: WithdrawData) => {
    if (data.amount > balance) {
      toast({ title: "Insufficient balance", description: `Your balance is RM${balance.toFixed(2)}`, variant: "destructive" });
      return;
    }
    try {
      await customFetch("/api/agents/commissions/withdraw", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Withdrawal requested!", description: "Your request has been submitted for admin approval." });
      setWithdrawOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["agent-me"] });
      refetchWithdrawals();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed to submit withdrawal request.", variant: "destructive" });
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Commission History</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your earned commissions and payouts</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet size={18} />
                <span className="text-sm font-medium opacity-80">Available Balance</span>
              </div>
              {canWithdraw && (
                <Button
                  size="sm"
                  onClick={() => setWithdrawOpen(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-8"
                >
                  <Banknote size={14} className="mr-1.5" />
                  Withdraw
                </Button>
              )}
            </div>
            <div className="text-3xl font-bold">RM {balance.toFixed(2)}</div>
            <div className="text-white/60 text-xs mt-1">
              {canWithdraw ? "Eligible for withdrawal" : `Min RM50 required to withdraw`}
            </div>
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

        {withdrawals && withdrawals.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Withdrawal Requests</h3>
            <div className="space-y-2">
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{w.bankName} — {w.accountNumber}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(w.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-foreground text-sm">RM {parseFloat(w.amount).toFixed(2)}</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[w.status] ?? "bg-muted text-muted-foreground"}`}>
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <>
              <div className="space-y-3">
                {paginated.map((c: any) => (
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">{commissions.length} records</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      <ChevronLeft size={16} /> Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">{page + 1}/{totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
              <DialogDescription>
                Minimum withdrawal is RM50. Your current balance is <strong>RM {balance.toFixed(2)}</strong>.
                Payouts are processed within 3–5 business days after admin approval.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onWithdraw)} className="space-y-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (RM)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="50" max={balance} placeholder="50.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bankName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Maybank, CIMB, Public Bank" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="accountName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl><Input placeholder="As per bank account" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="accountNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl><Input placeholder="e.g. 1234567890" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1 bg-primary text-white">Submit Request</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedLayout>
  );
}
