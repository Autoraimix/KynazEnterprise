import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useGetQuotation, getGetQuotationQueryKey, getListQuotationsQueryKey, customFetch } from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Copy, CheckCircle2, Upload, MessageCircle, QrCode, Building2, AlertCircle, PartyPopper, X, ZoomIn } from "lucide-react";
import { useState, useRef } from "react";
import duitnowQR from "@assets/shared_image_1779027541026.jpg";

const WHATSAPP_NUMBER = "60193590501";

export default function Payment() {
  const [, params] = useRoute("/dashboard/quotations/:id/payment");
  const id = parseInt(params?.id ?? "0", 10);
  const { data: quotation, isLoading } = useGetQuotation(id, { query: { enabled: !!id, queryKey: getGetQuotationQueryKey(id) } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showQREnlarged, setShowQREnlarged] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalPrice = quotation
    ? ((quotation.price ?? 0) + (quotation.taxAmount ?? 0))
    : 0;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file under 5MB.", variant: "destructive" });
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    if (!proofPreview) {
      toast({ title: "No file selected", description: "Please select your payment screenshot.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    try {
      await customFetch(`/api/quotations/${id}/payment-proof`, {
        method: "POST",
        body: JSON.stringify({ paymentProofUrl: proofPreview }),
      });
      queryClient.invalidateQueries({ queryKey: getGetQuotationQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey() });
      setProofSubmitted(true);
    } catch {
      toast({ title: "Error", description: "Failed to submit payment proof. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinishPayment = () => {
    setShowFinishDialog(false);
    toast({
      title: "Payment completed!",
      description: "Your payment proof has been submitted. Cashback will be credited once our team verifies it.",
    });
    setLocation(`/dashboard/quotations/${id}`);
  };

  const whatsappMessage = encodeURIComponent(
    `Hi Kynaz Enterprise! I've made payment for quotation ${quotation?.quotationRef ?? `#${id}`} (${quotation?.serviceName ?? "service"}). Amount: RM${totalPrice.toFixed(2)}. Please verify my payment. Thank you.`
  );

  return (
    <ProtectedLayout>
      <div className="max-w-3xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Link href={`/dashboard/quotations/${id}`}>
            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft size={16} /> Back</Button>
          </Link>
          <h1 className="text-xl font-serif font-bold text-foreground">Complete Payment</h1>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : !quotation ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <AlertCircle size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">Quotation not found.</p>
          </div>
        ) : quotation.status !== "approved" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-amber-600" />
            <p className="font-semibold text-amber-800 mb-1">Payment Not Available</p>
            <p className="text-amber-700 text-sm">This quotation must be accepted before proceeding to payment.</p>
            <Link href={`/dashboard/quotations/${id}`}>
              <Button variant="outline" className="mt-4">View Quotation</Button>
            </Link>
          </div>
        ) : proofSubmitted ? (
          /* === PROOF SUBMITTED SUCCESS STATE === */
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center space-y-5"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-emerald-800 mb-2">Payment Proof Submitted!</h2>
              <p className="text-emerald-700 text-sm leading-relaxed max-w-md mx-auto">
                Your payment screenshot has been uploaded successfully. Click <strong>Finish Payment</strong> below to confirm and complete your payment process.
              </p>
            </div>
            <div className="bg-white/70 rounded-xl p-4 text-sm text-emerald-800 border border-emerald-200 max-w-xs mx-auto">
              <div className="text-xs text-emerald-600 mb-1">Quotation</div>
              <div className="font-mono font-bold">{quotation.quotationRef ?? `#${id}`}</div>
              {totalPrice > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-emerald-600 mb-0.5">Amount Paid</div>
                  <div className="font-bold text-lg text-primary">RM {totalPrice.toFixed(2)}</div>
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowFinishDialog(true)}
              className="bg-primary text-white px-8 h-12 text-base font-semibold gap-2"
            >
              <PartyPopper size={18} />
              Finish Payment
            </Button>
            <p className="text-xs text-emerald-600">
              After finishing, our team will verify your payment and credit your cashback automatically.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
            {/* Quotation Summary */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold text-foreground mb-4">Payment Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quotation Ref</span>
                  <span className="font-mono font-semibold text-primary">{quotation.quotationRef ?? `#${quotation.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium text-foreground">{quotation.serviceName}</span>
                </div>
                {quotation.price != null && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium text-foreground">RM {quotation.price.toFixed(2)}</span>
                    </div>
                    {quotation.taxAmount != null && quotation.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (SST)</span>
                        <span className="font-medium text-foreground">RM {quotation.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">Total Amount</span>
                      <span className="font-bold text-xl text-primary">RM {totalPrice.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {quotation.price == null && (
                  <div className="text-amber-600 text-xs bg-amber-50 p-3 rounded-lg">
                    Price not yet set. Please contact us to confirm the exact amount before paying.
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* DuitNow QR */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode size={18} className="text-primary" />
                  <h3 className="font-semibold text-foreground">DuitNow QR</h3>
                </div>
                <div className="flex justify-center mb-4 relative group">
                  <button
                    onClick={() => setShowQREnlarged(true)}
                    className="relative cursor-zoom-in"
                    title="Click to enlarge QR code"
                  >
                    <img
                      src={duitnowQR}
                      alt="DuitNow QR Code"
                      className="w-48 h-48 object-contain rounded-lg border border-border shadow-sm group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 rounded-full p-2">
                        <ZoomIn size={20} className="text-white" />
                      </div>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Tap the QR to enlarge · Scan with any Malaysian banking app or e-wallet
                </p>
              </div>

              {/* Bank Transfer */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 size={18} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Bank Transfer</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Bank", value: "CIMB BANK BERHAD" },
                    { label: "Account Name", value: "KYNAZ ENTERPRISE" },
                    { label: "Account No.", value: "8606022781" },
                  ].map(item => (
                    <div key={item.label} className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground font-mono">{item.value}</span>
                        <button
                          onClick={() => handleCopy(item.value, item.label)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Copy"
                        >
                          {copied === item.label ? (
                            <CheckCircle2 size={15} className="text-emerald-600" />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPrice > 0 && (
                  <div className="mt-3 bg-primary/5 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">Transfer Amount</div>
                    <div className="font-bold text-primary text-lg">RM {totalPrice.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Proof */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload size={18} className="text-primary" />
                <h3 className="font-semibold text-foreground">Upload Payment Proof</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                After making payment, upload a screenshot or photo of your payment receipt/confirmation.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {proofPreview ? (
                <div className="space-y-3">
                  {proofFile?.type.startsWith("image/") ? (
                    <img src={proofPreview} alt="Payment proof preview" className="w-full max-h-48 object-contain rounded-lg border border-border" />
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-foreground">
                      {proofFile?.name}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={() => { setProofFile(null); setProofPreview(null); }} className="flex-1">
                      Change File
                    </Button>
                    <Button
                      onClick={handleSubmitProof}
                      disabled={isUploading}
                      className="flex-1 bg-primary text-white"
                    >
                      {isUploading ? "Submitting..." : "Submit Proof"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <Upload size={32} className="mx-auto mb-2 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-medium text-foreground">Click to upload payment screenshot</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF up to 5MB</p>
                </button>
              )}
            </div>

            {/* WhatsApp Option */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">Or Send via WhatsApp</h3>
              </div>
              <p className="text-sm text-emerald-700 mb-4">
                You can also send your payment proof directly to us via WhatsApp for faster processing.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full sm:w-auto">
                  <MessageCircle size={16} />
                  Send Payment Proof via WhatsApp
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </div>

      {/* QR Code Enlarged Lightbox */}
      {showQREnlarged && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowQREnlarged(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQREnlarged(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={22} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">DuitNow QR Code</h3>
            </div>
            <img
              src={duitnowQR}
              alt="DuitNow QR Code Enlarged"
              className="w-full object-contain rounded-xl border border-border shadow-sm"
            />
            <p className="text-xs text-muted-foreground text-center mt-3">
              Scan with any Malaysian banking app or e-wallet that supports DuitNow
            </p>
          </div>
        </div>
      )}

      {/* Finish Payment Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Completion</AlertDialogTitle>
            <AlertDialogDescription>
              By confirming, you acknowledge that you have completed the payment and your payment proof has been submitted. Our team will verify and process your cashback shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishPayment} className="bg-primary text-white hover:bg-primary/90">
              Confirm & Finish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedLayout>
  );
}
