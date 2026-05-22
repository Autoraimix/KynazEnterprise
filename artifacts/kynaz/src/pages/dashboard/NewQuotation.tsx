import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { useListServices, useGetQuotationSpeedSetting, useCreateQuotation, getListQuotationsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
import { ArrowLeft, Clock, Zap, Upload, CheckCircle2, Building2, Package, Layers } from "lucide-react";
import { useState, useRef } from "react";

const INSURANCE_PROVIDERS = ["Takaful Malaysia", "Etiqa Takaful"];

const schema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  insuranceProvider: z.string().min(1, "Please select an insurance provider"),
  fullName: z.string().min(2, "Full name is required (as per IC / Passport)"),
  phone: z.string().min(10, "Please enter a valid Malaysian phone number"),
  // Road Tax
  icNumber: z.string().optional(),
  address: z.string().optional(),
  plateNumber: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.string().optional(),
  roadtaxExpiry: z.string().optional(),
  naturalDisasterProtection: z.string().optional(),
  windscreenProtection: z.string().optional(),
  // Travel
  travelDestination: z.string().optional(),
  travelGroupType: z.string().optional(),
  travelPlan: z.string().optional(),
  travelStartDate: z.string().optional(),
  travelEndDate: z.string().optional(),
  numberOfPax: z.string().optional(),
  travelItinerary: z.string().optional(),
  preExistingConditions: z.string().optional(),
  // Home & Household
  homeCoverageType: z.string().optional(),
  propertyAddress: z.string().optional(),
  buildingSumInsured: z.string().optional(),
  contentsSumInsured: z.string().optional(),
  // Foreign Worker
  companyName: z.string().optional(),
  rocNumber: z.string().optional(),
  officeAddress: z.string().optional(),
  officeTel: z.string().optional(),
  fwigRef: z.string().optional(),
  fwhsRef: z.string().optional(),
  immigrationOffice: z.string().optional(),
  numberOfWorkers: z.string().optional(),
  // Generic
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Travel plan data ────────────────────────────────────────────────────────
const INTL_PLANS = [
  {
    id: "silver", name: "Silver",
    death: "RM100,000", medical: "RM100,000", evacuation: "RM300,000",
    tripCancel: "RM5,000", baggage: "RM2,000", delay: "RM600", premium: "From RM18/trip",
  },
  {
    id: "gold", name: "Gold",
    death: "RM200,000", medical: "RM200,000", evacuation: "RM500,000",
    tripCancel: "RM10,000", baggage: "RM3,000", delay: "RM1,000", premium: "From RM36/trip",
  },
  {
    id: "platinum", name: "Platinum",
    death: "RM500,000", medical: "RM500,000", evacuation: "Unlimited",
    tripCancel: "RM15,000", baggage: "RM5,000", delay: "RM1,500", premium: "From RM78/trip",
  },
];

const DOM_PLAN = {
  death: "RM50,000", medical: "RM30,000", evacuation: "RM150,000",
  tripCancel: "RM3,000", baggage: "RM1,000", delay: "RM300", premium: "From RM10/trip",
};

// ── Home coverage plan data ─────────────────────────────────────────────────
const HOME_PLANS = [
  {
    id: "building-only", label: "Building Only (Houseowner)",
    icon: Building2,
    type: "Houseowner",
    minSum: "RM67,000",
    from: "From RM5.60/mo",
    covers: ["Fire & lightning", "Explosion", "Flood & inundation (optional)", "Landslide (optional)", "Aircraft damage", "Riot & civil commotion", "Impact damage", "Burst pipes & overflowing tanks", "Earthquake (optional)"],
    notCovers: ["Contents & valuables", "Public liability"],
  },
  {
    id: "contents-only", label: "Contents Only (Householder)",
    icon: Package,
    type: "Householder",
    minSum: "RM18,000",
    from: "From RM4.66/mo",
    covers: ["Fire & lightning", "Explosion", "Theft & burglary", "Malicious damage", "Public liability up to RM100,000", "Electrical/mechanical breakdown", "Accidental damage to glass", "Flood & inundation (optional)"],
    notCovers: ["Building structure", "Fixed fittings"],
  },
  {
    id: "building-and-contents", label: "Building + Contents (Combined)",
    icon: Layers,
    type: "Combined",
    minSum: "RM85,000",
    from: "From RM9.27/mo",
    covers: ["Everything in Building Only plan", "Everything in Contents Only plan", "Public liability up to RM100,000", "Flood, landslide, earthquake (optional)", "Best value for homeowners"],
    notCovers: [],
  },
];

export default function NewQuotation() {
  const [, setLocation] = useLocation();
  const { data: services, isLoading: loadingServices } = useListServices();
  const { data: speedSetting } = useGetQuotationSpeedSetting();
  const createMutation = useCreateQuotation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "success">("form");
  const itineraryRef = useRef<HTMLInputElement>(null);
  const [itineraryFileName, setItineraryFileName] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceId: "", insuranceProvider: "", fullName: "", phone: "",
      icNumber: "", address: "", plateNumber: "", vehicleModel: "",
      vehicleYear: "", roadtaxExpiry: "", naturalDisasterProtection: "",
      windscreenProtection: "", travelDestination: "", travelGroupType: "",
      travelPlan: "", travelStartDate: "", travelEndDate: "",
      numberOfPax: "", travelItinerary: "", preExistingConditions: "",
      homeCoverageType: "", propertyAddress: "", buildingSumInsured: "",
      contentsSumInsured: "", companyName: "", rocNumber: "", officeAddress: "",
      officeTel: "", fwigRef: "", fwhsRef: "", immigrationOffice: "",
      numberOfWorkers: "", notes: "",
    },
  });

  const watchedServiceId = form.watch("serviceId");
  const watchedTravelDest = form.watch("travelDestination");
  const watchedTravelGroup = form.watch("travelGroupType");
  const watchedHomeCoverage = form.watch("homeCoverageType");

  const selectedService = services?.find(s => s.id.toString() === watchedServiceId);
  const isRoadTax = selectedService?.slug === "road-tax-renewal";
  const isTravel = selectedService?.slug === "travel-insurance";
  const isHome = selectedService?.slug === "home-protection";
  const isForeignWorker = selectedService?.slug === "foreign-worker-insurance";

  const showIntlPlans = isTravel && watchedTravelDest === "international";
  const showDomPlan = isTravel && watchedTravelDest === "domestic";
  const selectedHomePlan = HOME_PLANS.find(p => p.id === watchedHomeCoverage);

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

  const onSubmit = (data: FormData) => {
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
      if (!data.travelDestination?.trim()) { form.setError("travelDestination", { message: "Please select your destination type" }); isValid = false; }
      if (!data.travelGroupType?.trim()) { form.setError("travelGroupType", { message: "Please select individual or family" }); isValid = false; }
      if (!data.numberOfPax?.trim() || parseInt(data.numberOfPax, 10) < 1) {
        form.setError("numberOfPax", { message: "Please enter the number of travellers (minimum 1)" });
        isValid = false;
      }
      if (!data.icNumber?.trim()) { form.setError("icNumber", { message: "Lead traveller IC number is required" }); isValid = false; }
    }

    if (isHome) {
      if (!data.homeCoverageType?.trim()) { form.setError("homeCoverageType", { message: "Please select a coverage type" }); isValid = false; }
      if (!data.propertyAddress?.trim()) { form.setError("propertyAddress", { message: "Property address is required" }); isValid = false; }
    }

    if (isForeignWorker) {
      if (!data.companyName?.trim()) { form.setError("companyName", { message: "Company name is required" }); isValid = false; }
      if (!data.rocNumber?.trim()) { form.setError("rocNumber", { message: "ROC / SSM number is required" }); isValid = false; }
      if (!data.officeAddress?.trim()) { form.setError("officeAddress", { message: "Office address is required" }); isValid = false; }
      if (!data.officeTel?.trim()) { form.setError("officeTel", { message: "Office telephone number is required" }); isValid = false; }
      if (!data.numberOfWorkers?.trim()) { form.setError("numberOfWorkers", { message: "Number of workers is required" }); isValid = false; }
    }

    if (!isValid) return;

    const formData: Record<string, unknown> = {
      insuranceProvider: data.insuranceProvider,
      fullName: data.fullName,
      phone: data.phone,
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
      formData.travelDestination = data.travelDestination;
      formData.travelGroupType = data.travelGroupType;
      if (data.travelPlan) formData.travelPlan = data.travelPlan;
      if (data.travelStartDate) formData.travelStartDate = data.travelStartDate;
      if (data.travelEndDate) formData.travelEndDate = data.travelEndDate;
      formData.numberOfPax = parseInt(data.numberOfPax ?? "1", 10);
      formData.icNumber = data.icNumber;
      if (data.travelItinerary) formData.travelItinerary = data.travelItinerary;
      if (data.preExistingConditions?.trim()) formData.preExistingConditions = data.preExistingConditions;
    } else if (isHome) {
      formData.homeCoverageType = data.homeCoverageType;
      formData.propertyAddress = data.propertyAddress;
      if (data.buildingSumInsured?.trim()) formData.buildingSumInsured = data.buildingSumInsured;
      if (data.contentsSumInsured?.trim()) formData.contentsSumInsured = data.contentsSumInsured;
      if (data.notes?.trim()) formData.notes = data.notes;
    } else if (isForeignWorker) {
      formData.companyName = data.companyName;
      formData.rocNumber = data.rocNumber;
      formData.officeAddress = data.officeAddress;
      formData.officeTel = data.officeTel;
      formData.numberOfWorkers = parseInt(data.numberOfWorkers ?? "1", 10);
      if (data.fwigRef?.trim()) formData.fwigRef = data.fwigRef;
      if (data.fwhsRef?.trim()) formData.fwhsRef = data.fwhsRef;
      if (data.immigrationOffice?.trim()) formData.immigrationOffice = data.immigrationOffice;
      if (data.notes?.trim()) formData.notes = data.notes;
    } else {
      if (data.notes?.trim()) formData.notes = data.notes;
    }

    createMutation.mutate({
      data: { serviceId: parseInt(data.serviceId, 10), formData },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListQuotationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setStep("success");
      },
      onError: () => {
        toast({ title: "Submission Failed", description: "We could not submit your quotation request. Please try again.", variant: "destructive" });
      },
    });
  };

  if (step === "success") {
    return (
      <ProtectedLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-emerald-600" size={40} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Quotation Request Submitted!</h2>
            <p className="text-muted-foreground mb-2">
              {speedSetting?.fastMode
                ? "Your quotation will be ready within 10–15 minutes. We will notify you once it is available."
                : "Our team will prepare your quotation and get back to you within 24 hours."}
            </p>
            <p className="text-muted-foreground text-sm mb-8">You may track your quotation status under My Quotations.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setLocation("/dashboard/quotations")} className="bg-primary text-white">
                View My Quotations
              </Button>
              <Button variant="outline" onClick={() => { setStep("form"); form.reset(); setItineraryFileName(null); }}>
                Submit Another
              </Button>
            </div>
          </motion.div>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-2xl space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <Link href="/dashboard/quotations">
            <Button variant="outline" size="sm" className="gap-2"><ArrowLeft size={16} /> Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">Request a Quotation</h1>
            <p className="text-muted-foreground text-sm">Fill in the details below and our team will prepare your quotation</p>
          </div>
        </motion.div>

        {speedSetting && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`flex items-center gap-3 p-4 rounded-xl border ${speedSetting.fastMode ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
            {speedSetting.fastMode ? <Zap size={18} /> : <Clock size={18} />}
            <span className="text-sm font-medium">{speedSetting.message}</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6">
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
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Choose a service..." /></SelectTrigger>
                        </FormControl>
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
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select provider..." /></SelectTrigger>
                        </FormControl>
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
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Personal Information</h3>
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
                    <motion.div key="travel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Travel Details</h3>

                      {/* Destination & Group Type selectors */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="travelDestination" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destination Type <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select destination..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="domestic">Domestic (Within Malaysia)</SelectItem>
                                <SelectItem value="international">International (Overseas)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="travelGroupType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Type <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Individual or Family..." /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="family">Family (2 adults + children)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      {/* International plan table */}
                      <AnimatePresence>
                        {showIntlPlans && (
                          <motion.div key="intl-plans" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="border border-border rounded-xl overflow-hidden">
                              <div className="bg-primary/5 border-b border-border px-4 py-3">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                  International Travel Plan Comparison
                                  {watchedTravelGroup === "family" && <span className="ml-2 text-secondary normal-case font-normal">(Family rates apply — 2 adults + children)</span>}
                                </p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-border">
                                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Benefit</th>
                                      {INTL_PLANS.map(p => (
                                        <th key={p.id} className="text-center px-3 py-2.5 font-semibold text-foreground">{p.name}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[
                                      { label: "Accidental Death & PA", key: "death" as const },
                                      { label: "Medical Expenses Overseas", key: "medical" as const },
                                      { label: "Emergency Evacuation", key: "evacuation" as const },
                                      { label: "Trip Cancellation", key: "tripCancel" as const },
                                      { label: "Baggage Loss", key: "baggage" as const },
                                      { label: "Flight Delay", key: "delay" as const },
                                    ].map(({ label, key }) => (
                                      <tr key={key} className="border-b border-border/50 hover:bg-muted/30">
                                        <td className="px-3 py-2 text-muted-foreground">{label}</td>
                                        {INTL_PLANS.map(p => (
                                          <td key={p.id} className="px-3 py-2 text-center text-foreground font-medium">{p[key]}</td>
                                        ))}
                                      </tr>
                                    ))}
                                    <tr className="bg-secondary/5">
                                      <td className="px-3 py-2.5 font-semibold text-foreground">Est. Premium</td>
                                      {INTL_PLANS.map(p => (
                                        <td key={p.id} className="px-3 py-2.5 text-center font-bold text-secondary">{p.premium}</td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">* Family rates are approximately 250% of individual premium. Final premium subject to quotation.</p>
                            <FormField control={form.control} name="travelPlan" render={({ field }) => (
                              <FormItem className="mt-3">
                                <FormLabel>Preferred Plan <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Let our team recommend..." /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="silver">Silver</SelectItem>
                                    <SelectItem value="gold">Gold</SelectItem>
                                    <SelectItem value="platinum">Platinum</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Domestic plan info */}
                      <AnimatePresence>
                        {showDomPlan && (
                          <motion.div key="dom-plan" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="border border-border rounded-xl overflow-hidden">
                              <div className="bg-primary/5 border-b border-border px-4 py-3">
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                  Domestic Travel Plan
                                  {watchedTravelGroup === "family" && <span className="ml-2 text-secondary normal-case font-normal">(Family rates apply)</span>}
                                </p>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">Benefit</th>
                                    <th className="text-center px-3 py-2.5 font-semibold text-foreground">Standard Plan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[
                                    { label: "Accidental Death & PA", val: DOM_PLAN.death },
                                    { label: "Medical Expenses", val: DOM_PLAN.medical },
                                    { label: "Emergency Evacuation", val: DOM_PLAN.evacuation },
                                    { label: "Trip Cancellation", val: DOM_PLAN.tripCancel },
                                    { label: "Baggage Loss", val: DOM_PLAN.baggage },
                                    { label: "Flight / Bus Delay", val: DOM_PLAN.delay },
                                  ].map(({ label, val }) => (
                                    <tr key={label} className="border-b border-border/50 hover:bg-muted/30">
                                      <td className="px-3 py-2 text-muted-foreground">{label}</td>
                                      <td className="px-3 py-2 text-center text-foreground font-medium">{val}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-secondary/5">
                                    <td className="px-3 py-2.5 font-semibold text-foreground">Est. Premium</td>
                                    <td className="px-3 py-2.5 text-center font-bold text-secondary">{DOM_PLAN.premium}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">* Family rates approximately 200% of individual premium. Final premium subject to quotation.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Travel dates & travellers */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="travelStartDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travel Start Date <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="travelEndDate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Travel End Date <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

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
                          Travel Itinerary <span className="text-muted-foreground font-normal">(Optional — PDF, image)</span>
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

                {/* ── Home & Household Protection Fields ── */}
                <AnimatePresence>
                  {isHome && (
                    <motion.div key="home" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Home & Property Details</h3>

                      {/* Coverage type selector cards */}
                      <div>
                        <FormField control={form.control} name="homeCoverageType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coverage Type <span className="text-destructive">*</span></FormLabel>
                            <FormMessage />
                            <div className="grid sm:grid-cols-3 gap-3 mt-2">
                              {HOME_PLANS.map(plan => {
                                const Icon = plan.icon;
                                const selected = field.value === plan.id;
                                return (
                                  <button key={plan.id} type="button" onClick={() => field.onChange(plan.id)}
                                    className={`text-left p-4 rounded-xl border-2 transition-all ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
                                    <Icon size={22} className={selected ? "text-primary mb-2" : "text-muted-foreground mb-2"} />
                                    <p className={`text-xs font-semibold leading-tight ${selected ? "text-primary" : "text-foreground"}`}>{plan.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Min {plan.minSum}</p>
                                    <p className={`text-xs font-bold mt-1 ${selected ? "text-secondary" : "text-muted-foreground"}`}>{plan.from}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </FormItem>
                        )} />
                      </div>

                      {/* Plan coverage details */}
                      <AnimatePresence>
                        {selectedHomePlan && (
                          <motion.div key={selectedHomePlan.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="bg-primary/3 border border-primary/20 rounded-xl p-4">
                              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">{selectedHomePlan.label} — Coverage Highlights</p>
                              <div className="space-y-1.5">
                                {selectedHomePlan.covers.map(c => (
                                  <div key={c} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="text-foreground">{c}</span>
                                  </div>
                                ))}
                                {selectedHomePlan.notCovers.map(c => (
                                  <div key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="shrink-0 mt-0.5 text-muted-foreground/50">✗</span>
                                    <span>{c} (not covered)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FormField control={form.control} name="propertyAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Address to be Insured <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Textarea placeholder="Enter the full address of the property to be insured" rows={3} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid sm:grid-cols-2 gap-4">
                        {(watchedHomeCoverage === "building-only" || watchedHomeCoverage === "building-and-contents") && (
                          <FormField control={form.control} name="buildingSumInsured" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Building Sum Insured (RM) <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                              <FormControl><Input placeholder={`e.g. 200,000 (min RM67,000)`} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                        {(watchedHomeCoverage === "contents-only" || watchedHomeCoverage === "building-and-contents") && (
                          <FormField control={form.control} name="contentsSumInsured" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contents Sum Insured (RM) <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                              <FormControl><Input placeholder={`e.g. 50,000 (min RM18,000)`} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                      </div>

                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any additional details about your property (e.g. age of building, existing policy details, special valuables)" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Foreign Worker Insurance Fields ── */}
                <AnimatePresence>
                  {isForeignWorker && (
                    <motion.div key="fwi" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-5 overflow-hidden">
                      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Company & Worker Details</h3>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="companyName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="Registered company name" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="rocNumber" render={({ field }) => (
                          <FormItem>
                            <FormLabel>ROC / SSM No. <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. 1234567-A" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="officeAddress" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Office Address <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Textarea placeholder="Registered office address" rows={3} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="officeTel" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Office Tel. No. <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="e.g. 03-12345678" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="numberOfWorkers" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Workers <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="number" min={1} placeholder="e.g. 10" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">FWCMS Reference Numbers <span className="text-muted-foreground font-normal normal-case">(Optional — from FWCMS portal)</span></p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField control={form.control} name="fwigRef" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transaction Ref. No. FWIG</FormLabel>
                              <FormControl><Input placeholder="FWCMS reference for FWIG" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="fwhsRef" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transaction Ref. No. FWHS</FormLabel>
                              <FormControl><Input placeholder="FWCMS reference for FWHS" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="immigrationOffice" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Immigration Office</FormLabel>
                            <FormControl><Input placeholder="e.g. Imigresen Jalan Duta, Kuala Lumpur" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any other details relevant to your workers' insurance application." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Generic Notes (other services) ── */}
                <AnimatePresence>
                  {!isRoadTax && !isTravel && !isHome && !isForeignWorker && watchedServiceId && (
                    <motion.div key="generic" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please share any specific requirements, existing policy details, or other relevant information to help us prepare your quotation." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-primary text-white h-12 text-base font-semibold"
                >
                  {createMutation.isPending ? "Submitting your request..." : "Submit Quotation Request"}
                </Button>
              </form>
            </Form>
          )}
        </motion.div>
      </div>
    </ProtectedLayout>
  );
}
