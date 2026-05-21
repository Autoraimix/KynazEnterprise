import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAdminQuotations, useUpdateAdminQuotation, getListAdminQuotationsQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, FileText, User, CheckCircle2, Upload, Hash, DollarSign, Eye, MessageCircle, ShieldCheck, Lock } from "lucide-react";
import { useRef, useState } from "react";

const numOrUndefined = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

const schema = z.object({
  status: z.enum(["pending", "processing", "ready", "approved", "rejected", "expired", "paid"]),
  remarks: z.string().optional(),
  price: z.preprocess(numOrUndefined, z.number().min(0).optional()),
  taxAmount: z.preprocess(numOrUndefined, z.number().min(0).optional()),
}).superRefine((data, ctx) => {
  if (data.status === "rejected" && !data.remarks?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A rejection reason is required when rejecting a quotation",
      path: ["remarks"],
    });
  }
});

type FormData = z.infer<typeof schema>;

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800 border-blue-200" },
  ready: { label: "Ready", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200" },
  paid: { label: "Paid", color: "bg-purple-100 text-purple-800 border-purple-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export default function AdminQuotationDetail() {
  const [, params] = useRoute("/admin/quotations/:id");
  const id = parseInt(params?.id ?? "0", 10);
  const { data: allQuotations, isLoading } = useListAdminQuotations({});
  const quotation = allQuotations?.find(q => q.id === id);
  const updateMutation = useUpdateAdminQuotation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof updateMutation.mutate>[0]["data"] | null>(null);

  const isPaid = quotation?.status === "paid";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: quotation ? {
      status: quotation.status as FormData["status"],
      remarks: quotation.remarks ?? "",
      price: quotation.price ?? undefined,
      taxAmount: quotation.taxAmount ?? undefined,
    } : undefined,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file under 10MB.", variant: "destructive" });
      return;
    }
    if (file.type.startsWith("video/")) {
      toast({ title: "Videos not allowed", description: "Please upload a PDF or image file only.", variant: "destructive" });
      return;
    }
    setDocFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setDocPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const doUpdate = (payload: Parameters<typeof updateMutation.mutate>[0]["data"]) => {
    updateMutation.mutate({ id, data: payload }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminQuotationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        const isPaidNow = payload.status === "paid";
        toast({
          title: isPaidNow ? "Payment confirmed!" : "Updated!",
          description: isPaidNow
            ? "Quotation marked as paid. Cashback has been credited to the customer's wallet."
            : "Quotation updated successfully.",
        });
        setDocPreview(null);
        setDocFileName(null);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update quotation.", variant: "destructive" });
      },
    });
  };

  const onSubmit = (data: FormData) => {
    const payload: Parameters<typeof updateMutation.mutate>[0]["data"] = {
      status: data.status,
      remarks: data.remarks || undefined,
      price: (data.price as number | undefined),
      taxAmount: (data.taxAmount as number | undefined),
    };
    if (docPreview) payload.documentUrl = docPreview;

    // Intercept "paid" status change for confirmation
    if (data.status === "paid" && quotation?.status !== "paid") {
      setPendingPayload(payload);
      setShowPaidConfirm(true);
      return;
    }

    doUpdate(payload);
  };

  const handleConfirmPaid = () => {
    if (pendingPayload) {
      doUpdate(pendingPayload);
      setPendingPayload(null);
    }
    setShowPaidConfirm(false);
  };

  const guestPhone = quotation?.isGuest
    ? ((quotation.formData as Record<string, unknown>)?.phone as string | undefined)
    : undefined;

  const watchedStatus = form.watch("status");
  const watchedPrice = form.watch("price");
  const watchedTax = form.watch("taxAmount");

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Link href="/admin/quotations">
            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft size={16} /> Back</Button>
          </Link>
          <h1 className="text-xl font-serif font-bold text-foreground">Quotation Detail</h1>
          {isPaid && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
              <ShieldCheck size={13} /> Paid & Confirmed
            </span>
          )}
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : !quotation ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">Quotation not found.</p>
            <Link href="/admin/quotations">
              <Button variant="outline" className="mt-4">View All Quotations</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left panel — info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><User size={16} className="text-primary" /> Customer</h2>
                <div className="space-y-3 text-sm">
                  <div><div className="text-xs text-muted-foreground">Name</div><div className="font-medium text-foreground">{quotation.customerName ?? "Guest"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Email</div><div className="font-medium text-foreground">{quotation.customerEmail ?? (quotation.formData as Record<string, unknown>)?.email as string ?? "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">User ID</div><div className="font-medium text-foreground">{quotation.userId ? `#${quotation.userId}` : "Guest"}</div></div>
                  {quotation.isGuest && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <span className="inline-block bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Guest Quotation</span>
                      {guestPhone && (
                        <a
                          href={`https://wa.me/60${guestPhone.replace(/^0/, "").replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 w-full"
                        >
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full">
                            <MessageCircle size={14} />
                            WhatsApp Guest
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><FileText size={16} className="text-primary" /> Service</h2>
                <div className="space-y-3 text-sm">
                  {quotation.quotationRef && (
                    <div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Hash size={10} /> Quotation Ref</div>
                      <div className="font-mono font-bold text-primary">{quotation.quotationRef}</div>
                    </div>
                  )}
                  <div><div className="text-xs text-muted-foreground">Service Name</div><div className="font-medium text-foreground">{quotation.serviceName}</div></div>
                  <div><div className="text-xs text-muted-foreground">Submitted</div><div className="font-medium text-foreground">{new Date(quotation.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div></div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Current Status</div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusConfig[quotation.status]?.color ?? statusConfig.pending.color}`}>
                      {statusConfig[quotation.status]?.label ?? quotation.status}
                    </span>
                  </div>
                  {quotation.price != null && (
                    <div>
                      <div className="text-xs text-muted-foreground">Price (incl. tax)</div>
                      <div className="font-bold text-primary">RM {((quotation.price ?? 0) + (quotation.taxAmount ?? 0)).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment proof view */}
              {quotation.paymentProofUrl && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Eye size={16} className="text-primary" /> Payment Proof</h2>
                  <div className="space-y-2">
                    {quotation.paymentProofUrl.startsWith("data:image") ? (
                      <img src={quotation.paymentProofUrl} alt="Payment proof" className="w-full rounded-lg border border-border max-h-48 object-contain" />
                    ) : (
                      <a href={quotation.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-2 w-full">
                          <Eye size={14} /> View Payment Proof
                        </Button>
                      </a>
                    )}
                    {!isPaid && (
                      <p className="text-xs text-muted-foreground text-center">Set status to "Paid" to confirm and credit cashback.</p>
                    )}
                  </div>
                </div>
              )}

              {quotation.formData && Object.keys(quotation.formData).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-4">Submitted Info</h2>
                  <div className="space-y-2 text-sm">
                    {Object.entries(quotation.formData as Record<string, unknown>).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</div>
                        <div className="font-medium text-foreground break-words">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right panel */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="lg:col-span-3">

              {/* VIEW-ONLY for paid quotations */}
              {isPaid ? (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Lock size={26} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-1">Quotation Locked</h3>
                    <p className="text-purple-700 text-sm">
                      This quotation has been paid and confirmed. No further edits are allowed. Cashback has been credited to the customer's wallet.
                    </p>
                  </div>
                  {quotation.price != null && (
                    <div className="bg-white/60 rounded-lg p-3 inline-block">
                      <div className="text-xs text-purple-600 mb-1">Total Amount</div>
                      <div className="font-bold text-purple-800 text-xl">RM {((quotation.price ?? 0) + (quotation.taxAmount ?? 0)).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="font-semibold text-foreground mb-6 flex items-center gap-2"><CheckCircle2 size={18} className="text-secondary" /> Update Quotation</h2>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue placeholder="Select status..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["pending", "processing", "ready", "approved", "rejected", "expired", "paid"].map(s => (
                                <SelectItem key={s} value={s}>{statusConfig[s]?.label ?? s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Price fields */}
                      <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <DollarSign size={15} className="text-primary" />
                          Pricing (incl. Tax)
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base Price (RM)</FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-price"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={e => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="taxAmount" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Amount (RM)</FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-tax"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={e => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        {watchedPrice != null && watchedPrice !== undefined && (
                          <div className="text-sm text-muted-foreground">
                            Total: <span className="font-semibold text-primary">RM {((Number(watchedPrice) || 0) + (Number(watchedTax) || 0)).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <FormField control={form.control} name="remarks" render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Remarks to Customer
                            {watchedStatus === "rejected" && <span className="text-red-500 ml-1">*required for rejection</span>}
                            {watchedStatus !== "rejected" && <span className="text-muted-foreground font-normal ml-1">(Optional)</span>}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="input-remarks"
                              placeholder={watchedStatus === "rejected" ? "Please provide a reason for rejection..." : "Notes for the customer..."}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Document upload */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Upload size={14} className="text-primary" />
                          Upload Document <span className="text-muted-foreground font-normal">(PDF or image, no video)</span>
                        </label>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {docPreview ? (
                          <div className="space-y-2">
                            <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground flex items-center justify-between">
                              <span className="truncate">{docFileName}</span>
                              <button type="button" onClick={() => { setDocPreview(null); setDocFileName(null); }} className="text-muted-foreground hover:text-red-500 ml-2 text-xs">Remove</button>
                            </div>
                            {docPreview.startsWith("data:image") && (
                              <img src={docPreview} alt="Preview" className="max-h-24 rounded-lg object-contain border border-border" />
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            <Upload size={24} className="mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Click to upload quotation document</p>
                            {quotation.documentUrl && (
                              <p className="text-xs text-emerald-600 mt-1">Existing document available — upload to replace</p>
                            )}
                          </button>
                        )}
                        {quotation.documentUrl && !docPreview && (
                          <a href={quotation.documentUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-2 w-full" type="button">
                              <Eye size={13} /> View Current Document
                            </Button>
                          </a>
                        )}
                      </div>

                      {watchedStatus === "paid" && quotation.status !== "paid" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm">
                          <p className="font-semibold text-purple-800 mb-1 flex items-center gap-2">
                            <ShieldCheck size={15} /> Payment Verification
                          </p>
                          <p className="text-purple-700">
                            Setting status to "Paid" will automatically calculate and credit cashback to the customer's wallet based on the current cashback rate. You will be asked to confirm.
                          </p>
                        </div>
                      )}

                      <Button data-testid="button-update" type="submit" disabled={updateMutation.isPending} className="w-full bg-primary text-white h-11 font-semibold">
                        {updateMutation.isPending ? "Updating..." : "Update Quotation"}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Paid confirmation dialog */}
      <AlertDialog open={showPaidConfirm} onOpenChange={setShowPaidConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-purple-600" />
              Confirm Payment Verification
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">Are you sure you want to mark this quotation as <strong>Paid</strong>?</span>
              <span className="block">This will:</span>
              <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                <li>Lock the quotation from further edits</li>
                <li>Automatically credit cashback to the customer's wallet</li>
                <li>Notify the customer that their payment has been verified</li>
              </ul>
              <span className="block mt-2 font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPayload(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPaid}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              Yes, Confirm Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
