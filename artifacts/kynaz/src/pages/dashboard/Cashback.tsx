import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useGetCashbackWallet, useListCashbackTransactions, customFetch, getGetCashbackWalletQueryKey, getListCashbackTransactionsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, Gift, ArrowUpRight, ArrowDownRight, Banknote, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const withdrawSchema = z.object({
  amount: z.coerce.number().min(50, "Minimum withdrawal is RM50"),
  bankName: z.string().min(2, "Bank name required"),
  accountName: z.string().min(2, "Account holder name required"),
  accountNumber: z.string().min(5, "Account number required"),
});
type WithdrawData = z.infer<typeof withdrawSchema>;

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  earned: { label: "Earned", icon: ArrowUpRight, color: "text-emerald-600" },
  redeemed: { label: "Redeemed / Withdrawal", icon: ArrowDownRight, color: "text-red-500" },
  adjusted: { label: "Adjusted", icon: ArrowUpRight, color: "text-blue-500" },
  referral: { label: "Referral Bonus", icon: Gift, color: "text-secondary" },
  promotion: { label: "Promotion", icon: TrendingUp, color: "text-purple-500" },
};

const WD_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function Cashback() {
  const { data: wallet, isLoading: walletLoading } = useGetCashbackWallet();
  const { data: transactions, isLoading: txLoading } = useListCashbackTransactions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["cashback-withdrawals"],
    queryFn: () => customFetch<any[]>("/api/cashback/withdrawals"),
  });

  const balance = wallet?.balance ?? 0;
  const canWithdraw = balance >= 50;

  const form = useForm<WithdrawData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amount: 50, bankName: "", accountName: "", accountNumber: "" },
  });

  const onWithdraw = async (data: WithdrawData) => {
    if (data.amount > balance) {
      toast({ title: "Insufficient balance", description: `Your available balance is RM ${balance.toFixed(2)}`, variant: "destructive" });
      return;
    }
    try {
      await customFetch("/api/cashback/withdraw", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({ title: "Withdrawal request submitted!", description: "Your request has been submitted for admin review. Processed within 3–5 business days." });
      queryClient.invalidateQueries({ queryKey: getGetCashbackWalletQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListCashbackTransactionsQueryKey() });
      refetchWithdrawals();
      setShowWithdrawDialog(false);
      form.reset();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to process withdrawal request.";
      toast({ title: "Withdrawal failed", description: msg, variant: "destructive" });
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-4xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Cashback Wallet</h1>
            <p className="text-muted-foreground text-sm mt-1">Track your earnings and redemptions</p>
          </div>
          <Button
            onClick={() => setShowWithdrawDialog(true)}
            disabled={!canWithdraw || walletLoading}
            className="bg-secondary text-white hover:bg-secondary/90 gap-2"
            title={!canWithdraw ? "Minimum balance of RM 50 required to withdraw" : ""}
          >
            <Banknote size={16} />
            Request Withdrawal
          </Button>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Current Balance", value: wallet?.balance, icon: Wallet, color: "bg-primary text-white", textColor: "text-white" },
            { label: "Total Earned", value: wallet?.totalEarned, icon: TrendingUp, color: "bg-secondary/10 border border-secondary/20", textColor: "text-secondary" },
            { label: "Total Redeemed", value: wallet?.totalRedeemed, icon: TrendingDown, color: "bg-red-50 border border-red-200", textColor: "text-red-600" },
            { label: "Pending", value: wallet?.pendingAmount, icon: Gift, color: "bg-amber-50 border border-amber-200", textColor: "text-amber-600" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl p-5 ${card.color}`}>
              <card.icon size={20} className={`${card.textColor} mb-3 opacity-80`} />
              <div className={`text-xs mb-1 ${card.color.includes("primary") ? "text-white/70" : "text-muted-foreground"}`}>{card.label}</div>
              {walletLoading ? <Skeleton className="h-7 w-24 bg-white/20" /> : (
                <div className={`text-xl font-bold ${card.textColor}`}>RM {(card.value ?? 0).toFixed(2)}</div>
              )}
            </motion.div>
          ))}
        </div>

        {!walletLoading && !canWithdraw && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-amber-700 text-sm">
              You need a minimum balance of <strong>RM 50.00</strong> to request a cashback withdrawal. Keep earning by requesting more services!
            </p>
          </div>
        )}

        {withdrawals && withdrawals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-4">Withdrawal Requests</h2>
            <div className="space-y-2">
              {withdrawals.map((w: any) => (
                <div key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">{w.bankName} — {w.accountNumber}</div>
                      <div className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString("en-MY")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">RM {parseFloat(w.amount).toFixed(2)}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${WD_STATUS_COLORS[w.status] ?? "bg-muted text-muted-foreground"}`}>{w.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5">Transaction History</h2>
          {txLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : !transactions?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              <Wallet size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No transactions yet. Start by requesting a service quotation!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...transactions].reverse().map((tx, i) => {
                const config = typeConfig[tx.type] ?? typeConfig.earned;
                const isPositive = tx.type !== "redeemed";
                return (
                  <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    data-testid={`row-transaction-${tx.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? "bg-emerald-100" : "bg-red-100"}`}>
                        <config.icon size={15} className={config.color} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{tx.description}</div>
                        <div className="text-xs text-muted-foreground">{config.label} · {new Date(tx.createdAt).toLocaleDateString("en-MY")}</div>
                      </div>
                    </div>
                    <div className={`font-semibold text-sm ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                      {isPositive ? "+" : "-"}RM {Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote size={20} className="text-secondary" />
              Request Cashback Withdrawal
            </DialogTitle>
            <DialogDescription>
              Minimum withdrawal is RM 50.00. Your current balance is <strong>RM {balance.toFixed(2)}</strong>.
              Processed within 3–5 business days after admin approval.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onWithdraw)} className="space-y-4 py-2">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Amount (RM)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="50" max={balance} placeholder="50.00" {...field} /></FormControl>
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
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p>• Amount will be deducted from your balance immediately upon submission.</p>
                <p>• If rejected, the amount will be refunded to your wallet.</p>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowWithdrawDialog(false); form.reset(); }}>Cancel</Button>
                <Button type="submit" className="bg-secondary text-white hover:bg-secondary/90">Submit Request</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  );
}
