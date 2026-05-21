import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListServices, useGetQuotationSpeedSetting } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileSearch, CheckCircle2, Clock, Zap, Gift, Upload } from "lucide-react";
import { useState, useRef } from "react";

const INSURANCE_PROVIDERS = ["Takaful Malaysia", "Etiqa Takaful"];

const schema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  insuranceProvider: z.string().min(1, "Please select an insurance provider"),
  fullName: z.string().min(2, "Full name is required (as per IC / Passport)"),
  phone: z.string().min(10, "Please enter a valid Malaysian phone number"),
  email: z.string().email("Please enter a valid email address"),
  icNumber: z.string().optional(),
  address: z.string().optional(),
  plateNumber: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  roadtaxExpiry: z.string().optional(),
  naturalDisasterProtection: z.string().optional(),
  windscreenProtection: z.string().optional(),
  numberOfPax: z.string().optional(),
  travelItinerary: z.string().optional(),
  preExistingConditions: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function GuestQuote() {
  const { data: services, isLoading: loadingServices } = useListServices();
  const { data: speedSetting } = useGetQuotationSpeedSetting();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "success">("form");
  const [quotationRef, setQuotationRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itineraryRef = useRef<HTMLInputElement>(null);
  const [itineraryFileName, setItineraryFileName] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: "", insuranceProvider: "", fullName: "", phone: "", email: "",
      icNumber: "", address: "", plateNumber: "", vehicleModel: "",
      vehicleYear: "", roadtaxExpiry: "", naturalDisasterProtection: "",
      windscreenProtection: "", numberOfPax: "", travelItinerary: "",
      preExistingConditions: "", notes: "",
    },
  });

  const watchedServiceId = form.watch("serviceId");
  const selectedService = services?.find(s => s.id.toString() === watchedServiceId);
  const isRoadTax = selectedService?.name.toLowerCase().includes("road tax") ?? false;
  const isTravel = selectedService?.name.toLowerCase().includes("travel") ?? false;

  const handleItineraryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload a file under 10MB.", variant: "destructive" });
      return;
    }
    setItineraryFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => form.setValue("travelItinerary", reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    let isValid = true;

    if (isRoadTax) {
      if (!data.icNumber?.trim()) { form.setError("icNumber", { message: "IC number is required" }); isValid = false; }
      if (!data.address?.trim()) { form.setError("address", { message: "Address is required" }); isValid = false; }
      if (!data.plateNumber?.trim()) { form.setError("plateNumber", { message: "Vehicle plate number is required" }); isValid = false; }
      if (!data.vehicleModel?.trim()) { form.setError("vehicleModel", { message: "Vehicle model is required" }); isValid = false; }
      if (!data.vehicleYear?.trim()) { form.setError("vehicleYear", { message: "Year of purchase is required" }); isValid = false; }
      if (!data.roadtaxExpiry?.trim()) { form.setError("roadtaxExpiry", { message: "Road tax expiry date is required" }); isValid = false; }
    }

    if (isTravel) {
      if (!data.numberOfPax?.trim() || parseInt(data.numberOfPax, 10) < 1) {
        form.setError("numberOfPax", { message: "Please enter the number of travellers (minimum 1)" });
        isValid = false;
      }
      if (!data.icNumber?.trim()) { form.setError("icNumber", { message: "Lead traveller IC number is required" }); isValid = false; }
    }

    if (!isValid) return;

    const formData: Record<string, unknown> = {
      insuranceProvider: data.insuranceProvider,
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
    };

    if (isRoadTax) {
      formData.icNumber = data.icNumber;
      formData.address = data.address;
      formData.plateNumber = data.plateNumber?.toUpperCase();
      formData.vehicleModel = data.vehicleModel;
      formData.vehicleYear = data.vehicleYear;
      formData.roadtaxExpiry = data.roadtaxExpiry;
      if (data.naturalDisasterProtection) formData.naturalDisasterProtection = data.naturalDisasterProtection;
      if (data.windscreenProtection) formData.windscreenProtection = data.windscreenProtection;
    } else if (isTravel) {
      formData.numberOfPax = parseInt(data.numberOfPax ?? "1", 10);
      formData.icNumber = data.icNumber;
      if (data.travelItinerary) formData.travelItinerary = data.travelItinerary;
      if (data.preExistingConditions?.trim()) formData.preExistingConditions = data.preExistingConditions;
    } else {
      if (data.notes?.trim()) formData.notes = data.notes;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quotations/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: parseInt(data.serviceId, 10),
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          formData,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Submission failed");
      }
      const result = await res.json();
      setQuotationRef(result.quotationRef ?? `#${result.id}`);
      setStep("success");
    } catch (err: unknown) {
      toast({
        title: "Submission Failed",
        description: (err as Error).message ?? "We could not submit your quotation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto text-center py-20 px-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-emerald-600" size={40} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Quotation Request Submitted!</h2>
            <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">Your Quotation Reference</p>
              <p className="text-xl font-bold text-primary font-mono">{quotationRef}</p>
            </div>
            <p className="text-muted-foreground mb-3">
              {speedSetting?.fastMode
                ? "Our team is processing your request. You will be contacted within 10–15 minutes via the phone number or email provided."
                : "Thank you! Our team will review your request and contact you within 24 hours via the phone number or email you provided."}
            </p>
            <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 mb-8 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={16} className="text-secondary" />
                <span className="text-sm font-semibold text-secondary">Earn cashback rewards on every purchase</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Register for a free account to track your quotations, earn cashback on every payment, and enjoy exclusive member benefits.
              </p>
              <Link href="/register">
                <Button size="sm" className="mt-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full">
                  Create a Free Account
                </Button>
              </Link>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setStep("form"); form.reset(); setItineraryFileName(null); }} variant="outline">
                Submit Another Request
              </Button>
              <Link href="/">
                <Button className="bg-primary text-white">Back to Home</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft size={16} /> Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Free Quotation</h1>
            <p className="text-muted-foreground text-sm">No account required — receive your personalised quote in no time</p>
          </div>
        </motion.div>

        {/* Speed / Processing time banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`flex items-start gap-3 p-4 rounded-xl border ${speedSetting?.fastMode ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
          {speedSetting?.fastMode ? <Zap size={18} className="shrink-0 mt-0.5" /> : <Clock size={18} className="shrink-0 mt-0.5" />}
          <div className="text-sm">
            <span className="font-semibold">
              {speedSetting?.fastMode ? "Fast processing is active." : "Standard processing — response within 24 hours."}
            </span>{" "}
            {speedSetting?.fastMode
              ? "Our team will contact you within 10–15 minutes after receiving your request."
              : "Our team will contact you via phone or email with your personalised quotation."}
            <span className="block mt-1 opacity-80">
              Cashback rewards are available exclusively for registered members.{" "}
              <Link href="/register" className="font-semibold underline">Register free →</Link>
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileSearch size={20} className="text-primary" />
            <h2 className="font-semibold text-foreground">Quotation Request</h2>
          </div>

          {loadingServices ? (
            <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* ── Service & Insurance Provider ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Service Details</h3>
                  <FormField control={form.control} name="serviceId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Service <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Choose a service..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {services?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="insuranceProvider" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Insurance / Takaful Provider <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select provider..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {INSURANCE_PROVIDERS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* ── Common Contact Info ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Your Contact Information</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="As per IC / Passport" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number <span className="text-destructive">*</span></FormLabel>
                        <FormControl><Input placeholder="e.g. 0123456789" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* ── Road Tax Renewal Fields ── */}
                <AnimatePresence>
                  {isRoadTax && (
                    <motion.div key="road-tax" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Vehicle & Road Tax Details</h3>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="icNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>IC Number <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. 900101-14-5678" maxLength={14} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="plateNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Plate Number <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. WQR 1234" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Residential Address <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Textarea placeholder="Enter your full residential address" rows={3} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="vehicleModel" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Make & Model <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. Perodua Myvi 1.5" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="vehicleYear" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year of Purchase <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. 2019" maxLength={4} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="roadtaxExpiry" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Road Tax Expiry Date <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Optional Add-On Coverage</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="naturalDisasterProtection" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Protection Against Natural Disasters</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Not required" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="yes">Yes, I would like this coverage</SelectItem>
                                  <SelectItem value="no">No, not required</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="windscreenProtection" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Windscreen Protection</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Not required" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="yes">Yes, I would like this coverage</SelectItem>
                                  <SelectItem value="no">No, not required</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Travel Insurance Fields ── */}
                <AnimatePresence>
                  {isTravel && (
                    <motion.div key="travel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Travel & Traveller Details</h3>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="numberOfPax" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Travellers <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="number" min={1} max={20} placeholder="e.g. 2" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="icNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Traveller IC Number <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. 900101-14-5678" maxLength={14} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Upload size={14} className="text-primary" />
                          Travel Itinerary <span className="text-muted-foreground font-normal">(Optional — PDF or image)</span>
                        </label>
                        <input ref={itineraryRef} type="file" accept="image/*,.pdf" onChange={handleItineraryChange} className="hidden" />
                        {itineraryFileName ? (
                          <div className="bg-muted/50 rounded-lg p-3 text-sm flex items-center justify-between">
                            <span className="truncate text-foreground">{itineraryFileName}</span>
                            <button type="button" onClick={() => { setItineraryFileName(null); form.setValue("travelItinerary", ""); }} className="text-muted-foreground hover:text-red-500 ml-2 text-xs shrink-0">Remove</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => itineraryRef.current?.click()}
                            className="w-full border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-all">
                            <Upload size={20} className="mx-auto mb-1 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Click to upload your travel itinerary</p>
                          </button>
                        )}
                      </div>

                      <FormField control={form.control} name="preExistingConditions" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre-existing Medical Conditions <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please state if any traveller is currently managing a medical condition (e.g. diabetes, hypertension, asthma). Leave blank if none." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Generic Notes (other services) ── */}
                <AnimatePresence>
                  {!isRoadTax && !isTravel && watchedServiceId && (
                    <motion.div key="generic" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please share any specific requirements, existing policy details, or other relevant information." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white h-12 text-base font-semibold"
                >
                  {isSubmitting ? "Submitting your request..." : "Submit Free Quotation Request"}
                </Button>
              </form>
            </Form>
          )}
        </motion.div>
      </div>
    </PublicLayout>
  );
}
