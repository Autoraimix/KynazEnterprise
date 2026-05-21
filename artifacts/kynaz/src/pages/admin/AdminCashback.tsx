import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminCashback, useAddCashback, getListAdminCashbackQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, TrendingUp, TrendingDown, Gift, ArrowUpRight, ArrowDownRight, Percent, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { customFetch } from "@workspace/api-client-react";

const adjustSchema = z.object({
  userId: z.string().min(1, "User ID required"),
  amount: z.coerce.number().min(0.01, "Amount must be > 0"),
  type: z.enum(["earned", "redeemed", "adjusted", "promotion"]),
  description: z.string().min(3, "Description required"),
});

type AdjustData = z.infer<typeof adjustSchema>;

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  earned: { label: "Earned", icon: ArrowUpRight, color: "text-emerald-600" },
  redeemed: { label: "Redeemed", icon: ArrowDownRight, color: "text-red-500" },
  adjusted: { label: "Adjusted", icon: ArrowUpRight, color: "text-blue-500" },
  referral: { label: "Referral", icon: Gift, color: "text-secondary" },
  promotion: { label: "Promotion", icon: TrendingUp, color: "text-purple-500" },
};

export default function AdminCashback() {
  const { data: transactions, isLoading } = useListAdminCashback();
  const addCashbackMutation = useAddCashback();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Cashback rate state
  const [cashbackRate, setCashbackRate] = useState<number>(5);
  const [rateInput, setRateInput] = useState("5");
  const [loadingRate, setLoadingRate] = useState(true);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    customFetch<{ rate: number }>("/api/admin/settings/cashback-rate")
      .then(data => {
        setCashbackRate(data.rate);
        setRateInput(String(data.rate));
      })
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
    defaultValues: { userId: "", amount: 0, type: "earned", description: "" },
  });

  const onAdjust = (data: AdjustData) => {
    addCashbackMutation.mutate({
      data: {
        userId: parseInt(data.userId, 10),
        amount: data.amount,
        type: data.type,
        description: data.description,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminCashbackQueryKey() });
        toast({ title: "Cashback adjusted!", description: "The user's cashback balance has been updated." });
        form.reset({ userId: "", amount: 0, type: "earned", description: "" });
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to adjust cashback.";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    });
  };

  const totalEarned = transactions?.filter(t => t.type !== "redeemed").reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const totalRedeemed = transactions?.filter(t => t.type === "redeemed").reduce((sum, t) => sum + t.amount, 0) ?? 0;

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-serif font-bold text-foreground">Cashback Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage cashback rates and customer balances</p>
        </motion.div>

        {/* Cashback Rate Setting */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground">Cashback Rate Setting</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Set the cashback percentage applied to the quotation price when a payment is verified and marked as "Paid".
          </p>
          {loadingRate ? (
            <Skeleton className="h-12 w-64 rounded-xl" />
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rateInput}
                  onChange={e => setRateInput(e.target.value)}
                  className="w-32 pr-8"
                  placeholder="5.0"
                />
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
            { label: "Total Redeemed", value: `RM ${totalRedeemed.toFixed(2)}`, icon: TrendingDown, bg: "bg-red-50", color: "text-red-600" },
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

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-3 bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-5">Recent Transactions</h2>
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : !transactions?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No transactions yet.</p>
              </div>
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
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-5">Manual Adjustment</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAdjust)} className="space-y-4">
                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>User ID</FormLabel>
                    <FormControl><Input data-testid="input-user-id" placeholder="Enter user ID (number)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["earned", "redeemed", "adjusted", "promotion"].map(t => (
                          <SelectItem key={t} value={t} className="capitalize">{typeConfig[t]?.label ?? t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input data-testid="input-description" placeholder="Reason for adjustment..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button data-testid="button-adjust" type="submit" disabled={addCashbackMutation.isPending} className="w-full bg-primary text-white h-11">
                  {addCashbackMutation.isPending ? "Processing..." : "Apply Adjustment"}
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
