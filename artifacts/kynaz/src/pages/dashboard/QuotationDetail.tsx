import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useGetQuotation, useAcceptQuotation, getListQuotationsQueryKey, getGetDashboardSummaryQueryKey, getGetQuotationQueryKey } from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, CheckCircle2, Clock, XCircle, FileText, AlertCircle, CreditCard, Hash, Upload, ShieldCheck } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  pending: { label: "Pending Review", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  processing: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Clock },
  ready: { label: "Ready for Review", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  approved: { label: "Approved — Awaiting Payment", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 },
  paid: { label: "Paid & Confirmed", color: "text-purple-600 bg-purple-50 border-purple-200", icon: ShieldCheck },
  rejected: { label: "Rejected", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
  expired: { label: "Expired", color: "text-gray-500 bg-gray-50 border-gray-200", icon: AlertCircle },
};

function downloadBlob(dataUrl: string, filename: string) {
  if (dataUrl.startsWith("data:")) {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] ?? "application/octet-stream";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    const blob = new Blob([u8arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } else {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export default function QuotationDetail() {
  const [, params] = useRoute("/dashboard/quotations/:id");
  const id = parseInt(params?.id ?? "0", 10);
  const { data: quotation, isLoading } = useGetQuotation(id, { query: { enabled: !!id, queryKey: getGetQuotationQueryKey(id) } });
  const acceptMutation = useAcceptQuotation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAccept = () => {
    acceptMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetQuotationQueryKey(id) });
        toast({ title: "Quotation accepted!", description: "Proceed to payment to complete your purchase." });
        setLocation(`/dashboard/quotations/${id}/payment`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to accept quotation.", variant: "destructive" });
      },
    });
  };

  const status = quotation?.status as string | undefined;
  const statusInfo = status ? (statusConfig[status] ?? statusConfig.pending) : null;
  const StatusIcon = statusInfo?.icon ?? Clock;
  const totalPrice = quotation ? ((quotation.price ?? 0) + (quotation.taxAmount ?? 0)) : 0;
  const proofSubmitted = quotation?.status === "approved" && !!(quotation as unknown as { paymentProofUrl?: string | null })?.paymentProofUrl;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Link href="/dashboard/quotations">
            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft size={16} /> Back</Button>
          </Link>
          <h1 className="text-xl font-serif font-bold text-foreground">Quotation Details</h1>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !quotation ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FileText size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">Quotation not found.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            {/* Status banner */}
            <div className={`rounded-xl p-5 border ${statusInfo?.color}`}>
              <div className="flex items-center gap-3">
                <StatusIcon size={22} />
                <div>
                  <div className="font-semibold">{statusInfo?.label}</div>
                  <div className="text-sm opacity-80">
                    {status === "pending" && "Your request is in queue. We'll process it soon."}
                    {status === "processing" && "Our team is preparing your quotation."}
                    {status === "ready" && "Your quotation is ready! Review and accept below."}
                    {status === "approved" && !proofSubmitted && "Quotation accepted. Please proceed to payment."}
                    {status === "approved" && proofSubmitted && "Payment proof submitted. Awaiting admin verification."}
                    {status === "paid" && "Payment confirmed. Cashback has been credited to your wallet!"}
                    {status === "rejected" && "This quotation was rejected. See the reason below."}
                    {status === "expired" && "This quotation has expired. Please submit a new request."}
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection reason — shown prominently */}
            {status === "rejected" && quotation.remarks && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={18} className="text-red-600" />
                  <h3 className="font-semibold text-red-800">Rejection Reason</h3>
                </div>
                <p className="text-red-700 text-sm leading-relaxed">{quotation.remarks}</p>
              </div>
            )}

            {/* Quotation info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4 text-lg">{quotation.serviceName}</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {quotation.quotationRef && (
                  <div>
                    <div className="text-muted-foreground mb-1 flex items-center gap-1"><Hash size={12} /> Quotation Reference</div>
                    <div className="font-mono font-bold text-primary text-base">{quotation.quotationRef}</div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground mb-1">Submitted</div>
                  <div className="text-foreground font-medium">{new Date(quotation.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Last Updated</div>
                  <div className="text-foreground font-medium">{new Date(quotation.updatedAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
                {quotation.expiresAt && (
                  <div>
                    <div className="text-muted-foreground mb-1">Expires</div>
                    <div className="text-foreground font-medium">{new Date(quotation.expiresAt).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                )}
              </div>

              {/* Price section */}
              {quotation.price != null && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-muted-foreground text-sm mb-2 font-medium">Pricing</div>
                  <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">RM {quotation.price.toFixed(2)}</span>
                    </div>
                    {quotation.taxAmount != null && quotation.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (SST)</span>
                        <span className="font-medium">RM {quotation.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">Total Payable</span>
                      <span className="font-bold text-primary text-base">RM {totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks — shown for non-rejected statuses */}
              {quotation.remarks && status !== "rejected" && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-muted-foreground text-sm mb-1">Remarks from Admin</div>
                  <div className="text-foreground text-sm bg-muted/50 rounded-lg p-3">{quotation.remarks}</div>
                </div>
              )}
            </div>

            {/* Ready — accept quotation */}
            {status === "ready" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <h3 className="font-semibold text-emerald-800 mb-2">Quotation Ready</h3>
                <p className="text-emerald-700 text-sm mb-4">Review the document and click Accept to proceed to payment.</p>
                <div className="flex gap-3 flex-wrap">
                  {quotation.documentUrl && (
                    <Button
                      variant="outline"
                      className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => downloadBlob(quotation.documentUrl!, `quotation-${quotation.quotationRef ?? id}`)}
                    >
                      <Download size={16} /> Download Document
                    </Button>
                  )}
                  <Button
                    data-testid="button-accept"
                    onClick={handleAccept}
                    disabled={acceptMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <CheckCircle2 size={16} />
                    {acceptMutation.isPending ? "Accepting..." : "Accept & Proceed to Payment"}
                  </Button>
                </div>
              </div>
            )}

            {/* Approved — payment proof submitted */}
            {status === "approved" && proofSubmitted && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Upload size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Payment Submitted</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Your payment proof has been submitted successfully. Our team will verify your payment and credit your cashback shortly. No further action is needed.
                </p>
              </div>
            )}

            {/* Approved — proceed to payment (proof not yet submitted) */}
            {status === "approved" && !proofSubmitted && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-semibold text-blue-800 mb-2">Payment Required</h3>
                <p className="text-blue-700 text-sm mb-4">
                  Your quotation has been accepted. Please complete payment to activate your coverage.
                </p>
                <Link href={`/dashboard/quotations/${quotation.id}/payment`}>
                  <Button className="bg-primary text-white gap-2">
                    <CreditCard size={16} />
                    Proceed to Payment
                  </Button>
                </Link>
              </div>
            )}

            {/* Paid — show cashback credited */}
            {status === "paid" && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Payment Verified</h3>
                </div>
                <p className="text-purple-700 text-sm">
                  Your payment has been confirmed and cashback has been credited to your wallet. Thank you for choosing Kynaz Enterprise!
                </p>
              </div>
            )}

            {/* Documents */}
            {quotation.documentUrl && status !== "ready" && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3">Documents</h3>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => downloadBlob(quotation.documentUrl!, `quotation-${quotation.quotationRef ?? id}`)}
                >
                  <Download size={16} /> Download Quotation Document
                </Button>
              </div>
            )}

            {/* Submitted info */}
            {quotation.formData && Object.keys(quotation.formData).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Submitted Information</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {Object.entries(quotation.formData as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 rounded-lg p-3">
                      <div className="text-muted-foreground text-xs capitalize mb-1">{key.replace(/_/g, " ")}</div>
                      <div className="text-foreground font-medium">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </ProtectedLayout>
  );
}
