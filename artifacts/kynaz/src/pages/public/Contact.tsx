import { PublicLayout } from "@/components/layout/PublicLayout";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Contact() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  const onSubmit = (_data: FormData) => {
    toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
    form.reset();
  };

  return (
    <PublicLayout>
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Contact Us
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/70 text-lg max-w-xl mx-auto">
            We're here to help. Reach out via any channel and our team will respond promptly.
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Get in Touch</h2>
                {[
                  { icon: Phone, title: "Phone", info: "+6019-359 0501", sub: "Mon-Fri, 9am-6pm" },
                  { icon: Mail, title: "Email", info: "info@kynaz.com.my", sub: "Response within 24 hours" },
                  { icon: MapPin, title: "Office", info: "Kuala Lumpur, Malaysia", sub: "By appointment" },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{item.title}</div>
                      <div className="text-foreground text-sm">{item.info}</div>
                      <div className="text-muted-foreground text-xs">{item.sub}</div>
                    </div>
                  </div>
                ))}

                <a
                  href="https://wa.me/60193590501"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-[#25D366] text-white rounded-xl hover:bg-[#20b954] transition-colors"
                >
                  <MessageCircle size={22} />
                  <div>
                    <div className="font-semibold">WhatsApp Us</div>
                    <div className="text-white/80 text-xs">Quick responses via WhatsApp</div>
                  </div>
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-3 bg-card border border-border rounded-2xl p-8"
            >
              <h3 className="text-xl font-semibold text-foreground mb-6">Send us a Message</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input data-testid="input-name" placeholder="Ahmad Faisal" {...field} /></FormControl>
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
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input data-testid="input-email" placeholder="you@example.com" type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="message" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl><Textarea data-testid="input-message" placeholder="Tell us how we can help you..." rows={5} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button data-testid="button-submit" type="submit" className="w-full bg-primary text-primary-foreground h-11 font-semibold">
                    Send Message
                  </Button>
                </form>
              </Form>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
