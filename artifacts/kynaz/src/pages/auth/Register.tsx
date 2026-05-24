import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", referralCode: "" },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate({ data: { ...data, referralCode: data.referralCode || null } }, {
      onSuccess: (result) => {
        login(result);
        toast({ title: "Account created!", description: "Welcome to KYNAZ. Start earning cashback today!" });
        setLocation("/dashboard");
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
        toast({ title: "Registration failed", description: msg, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full border-2 border-white" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center"
        >
          <div className="flex justify-center mb-8">
            <img src="/logo.png" alt="KYNAZ" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join KYNAZ Today</h1>
          <p className="text-white/70 text-lg max-w-xs leading-relaxed">
            Create your account and start earning cashback rewards on every service purchase.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { step: "1", title: "Register for Free", desc: "Create your account in minutes" },
              { step: "2", title: "Request Quotations", desc: "Get competitive quotes for any service" },
              { step: "3", title: "Earn Cashback", desc: "Rewards on every completed transaction" },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-4 text-left bg-white/10 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center text-secondary font-bold text-sm shrink-0">{item.step}</div>
                <div>
                  <div className="text-white font-semibold text-sm">{item.title}</div>
                  <div className="text-white/60 text-xs">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 mb-6 text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft size={16} /> Back to Home
            </Button>
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="KYNAZ" className="h-8 w-auto object-contain" />
            <span className="font-bold text-primary">KYNAZ</span>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">Create account</h2>
          <p className="text-muted-foreground mb-8">Join thousands of members earning cashback</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input data-testid="input-fullname" placeholder="Ahmad Faisal" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input data-testid="input-email" placeholder="you@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input data-testid="input-phone" placeholder="0123456789" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input data-testid="input-password" placeholder="Min. 6 characters" type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="referralCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Code <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                  <FormControl><Input data-testid="input-referral" placeholder="Enter referral code" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold mt-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By registering, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
