import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate({ data }, {
      onSuccess: (result) => {
        login(result);
        toast({ title: "Welcome back!", description: `Logged in as ${result.user.fullName}` });
        const role = result.user.role;
        if (role === "admin" || role === "superadmin") {
          setLocation("/admin");
        } else if (role === "agent") {
          setLocation("/agent");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Invalid email or password";
        toast({ title: "Login failed", description: msg, variant: "destructive" });
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
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Back button */}
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

          <div className="bg-muted/40 rounded-xl p-4 mb-6 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Demo accounts:</p>
            <p className="text-xs text-muted-foreground">Customer: demo@kynaz.com / demo123</p>
            <p className="text-xs text-muted-foreground">Admin: admin@kynaz.com / admin123</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input data-testid="input-email" placeholder="you@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input data-testid="input-password" placeholder="••••••••" type="password" {...field} />
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
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">Create account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
