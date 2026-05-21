import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, ArrowLeft, KeyRound, Mail, Lock, Clock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

type LoginData = z.infer<typeof loginSchema>;
type OtpData = z.infer<typeof otpSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const { user, isLoading, login } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pendingToken, setPendingToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);

  // Security: redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      const role = user.role;
      if (role === "superadmin") setLocation("/superadmin");
      else if (role === "admin") setLocation("/admin");
      else if (role === "agent") setLocation("/agent");
      else setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  // Show idle timeout message
  useEffect(() => {
    if (searchStr?.includes("reason=idle")) {
      toast({
        title: "Session expired",
        description: "You were logged out due to inactivity. Please log in again.",
        variant: "destructive",
      });
    }
  }, []);

  // Countdown for OTP resend
  useEffect(() => {
    if (otpResendCountdown <= 0) return;
    const t = setTimeout(() => setOtpResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpResendCountdown]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const otpForm = useForm<OtpData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    const visible = local.slice(0, 3);
    return `${visible}${"*".repeat(Math.max(0, local.length - 3))}@${domain}`;
  };

  const onCredentialsSubmit = async (data: LoginData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json() as { requiresOtp?: boolean; pendingToken?: string; error?: string };

      if (!res.ok) {
        toast({ title: "Login failed", description: result.error ?? "Invalid email or password", variant: "destructive" });
        return;
      }

      if (result.requiresOtp && result.pendingToken) {
        setPendingToken(result.pendingToken);
        setMaskedEmail(maskEmail(data.email));
        setStep("otp");
        setOtpResendCountdown(60);
        toast({ title: "OTP Sent", description: "Check your email for the 6-digit verification code." });
      }
    } catch {
      toast({ title: "Login failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onOtpSubmit = async (data: OtpData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken, otp: data.otp }),
      });
      const result = await res.json() as { user?: { role: string; fullName: string }; token?: string; error?: string };

      if (!res.ok) {
        toast({ title: "Verification failed", description: result.error ?? "Invalid OTP", variant: "destructive" });
        if (result.error?.includes("expired") || result.error?.includes("log in again")) {
          setStep("credentials");
          setPendingToken("");
          otpForm.reset();
        }
        return;
      }

      if (result.user && result.token) {
        login({ user: result.user as Parameters<typeof login>[0]["user"], token: result.token });
        toast({ title: "Welcome back!", description: `Signed in as ${result.user.fullName}` });
        const role = result.user.role;
        if (role === "superadmin") setLocation("/superadmin");
        else if (role === "admin") setLocation("/admin");
        else if (role === "agent") setLocation("/agent");
        else setLocation("/dashboard");
      }
    } catch {
      toast({ title: "Verification failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    const values = loginForm.getValues();
    await onCredentialsSubmit(values);
  };

  if (isLoading) return null;
  if (user) return null;

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full border-2 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-secondary/20 border border-secondary/40 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Shield className="text-secondary" size={40} />
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-4">Kynaz Enterprise</h1>
          <p className="text-white/70 text-lg max-w-xs leading-relaxed">
            Your trusted partner for insurance, takaful & compliance services in Malaysia.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[{ val: "10K+", label: "Customers" }, { val: "99%", label: "Satisfaction" }, { val: "10+", label: "Services" }].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold text-secondary">{item.val}</div>
                <div className="text-white/60 text-xs mt-1">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 justify-center text-white/50 text-sm">
            <Shield size={14} />
            <span>OTP-secured login</span>
            <span>·</span>
            <Lock size={14} />
            <span>Session timeout protection</span>
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
              >
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2 mb-6 text-muted-foreground hover:text-foreground -ml-2">
                    <ArrowLeft size={16} /> Back to Home
                  </Button>
                </Link>

                <div className="lg:hidden flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-serif font-bold text-white">K</div>
                  <span className="font-serif font-bold text-primary">Kynaz Enterprise</span>
                </div>

                <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Welcome back</h2>
                <p className="text-muted-foreground mb-8">Sign in to access your portal</p>

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onCredentialsSubmit)} className="space-y-5">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                            <Input data-testid="input-email" placeholder="you@example.com" type="email" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                            <Input data-testid="input-password" placeholder="••••••••" type="password" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
                    </div>
                    <Button
                      data-testid="button-submit"
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verifying..." : "Continue"}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-primary font-semibold hover:underline">Create account</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
              >
                <Button
                  variant="ghost" size="sm"
                  className="gap-2 mb-6 text-muted-foreground hover:text-foreground -ml-2"
                  onClick={() => { setStep("credentials"); otpForm.reset(); }}
                >
                  <ArrowLeft size={16} /> Back
                </Button>

                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl mx-auto mb-6">
                  <KeyRound className="text-primary" size={32} />
                </div>

                <h2 className="text-3xl font-serif font-bold text-foreground mb-2 text-center">Enter OTP</h2>
                <p className="text-muted-foreground mb-2 text-center text-sm">
                  We sent a 6-digit code to
                </p>
                <p className="text-center font-semibold text-foreground mb-8">{maskedEmail}</p>

                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-5">
                    <FormField control={otpForm.control} name="otp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000000"
                            maxLength={6}
                            className="text-center text-2xl font-bold tracking-[0.5em] h-14"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                  </form>
                </Form>

                <div className="text-center mt-4">
                  {otpResendCountdown > 0 ? (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Clock size={14} /> Resend in {otpResendCountdown}s
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-sm text-primary hover:underline"
                      disabled={isSubmitting}
                    >
                      Didn't receive it? Resend OTP
                    </button>
                  )}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                  This code expires in 5 minutes for your security.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
