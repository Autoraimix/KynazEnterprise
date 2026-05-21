import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useResetPassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const resetMutation = useResetPassword();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: FormData) => {
    resetMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Reset link sent", description: "Check your email for the password reset link." });
        form.reset();
      },
      onError: () => {
        toast({ title: "Request sent", description: "If that email is registered, a reset link has been sent." });
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
            <Mail className="text-primary" size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Reset your password</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Enter your email and we'll send you a link to reset your password.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input data-testid="input-email" placeholder="you@example.com" type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full bg-primary text-primary-foreground h-11"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>

          <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
