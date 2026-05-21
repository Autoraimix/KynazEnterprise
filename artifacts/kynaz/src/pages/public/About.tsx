import { PublicLayout } from "@/components/layout/PublicLayout";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Target, Eye, Award, Phone, Mail, MapPin } from "lucide-react";

export default function About() {
  return (
    <PublicLayout>
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            About Kynaz Enterprise
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/70 text-lg max-w-xl mx-auto">
            Your trusted partner for insurance, takaful, and compliance services in Malaysia.
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Our Story</span>
              <h2 className="text-3xl font-serif font-bold text-foreground mt-2 mb-4">Built on Trust, Driven by Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Kynaz Enterprise was founded with a single mission: to simplify the complex world of insurance and takaful for Malaysian businesses and individuals. We bridge the gap between customers and leading insurers, providing transparent, efficient, and rewarding service.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our integrated digital platform allows customers to request quotations, track submissions, manage renewals, and earn cashback rewards — all in one place. We are committed to raising the standard of service in the insurance intermediary industry.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
              {[
                { val: "10,000+", label: "Customers Served" },
                { val: "10+", label: "Service Categories" },
                { val: "99%", label: "Customer Satisfaction" },
                { val: "5 Years", label: "Industry Experience" },
              ].map(item => (
                <div key={item.label} className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{item.val}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground">Vision & Mission</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-5">
                <Eye className="text-secondary" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                To be Malaysia's most trusted and innovative integrated service portal, empowering customers with seamless insurance and takaful solutions while rewarding their loyalty.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                <Target className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To digitize and simplify the service experience, increase customer retention through meaningful cashback rewards, and deliver exceptional value through technology-driven solutions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">Why Choose Kynaz</h2>
            <p className="text-muted-foreground">We're not just a broker — we're your long-term service partner.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Licensed & Certified", desc: "Fully licensed insurance intermediary registered with relevant Malaysian regulatory authorities." },
              { icon: Award, title: "Cashback Rewards", desc: "Earn meaningful cashback on every service transaction. Our members save more with every purchase." },
              { icon: Target, title: "Digital-First", desc: "Manage all your insurance needs from one centralized portal, available 24/7 on any device." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="text-center p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon size={28} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif font-bold text-white mb-3">Contact Details</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
              { icon: Phone, label: "Phone", value: "+6019-359 0501" },
              { icon: Mail, label: "Email", value: "info@kynaz.com.my" },
              { icon: MapPin, label: "Address", value: "Kuala Lumpur, Malaysia" },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-6">
                <item.icon size={24} className="text-secondary mx-auto mb-3" />
                <div className="text-white/60 text-sm mb-1">{item.label}</div>
                <div className="text-white font-semibold">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/contact">
              <Button className="bg-secondary text-white hover:bg-secondary/90 px-8 h-12 font-semibold">Get In Touch</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
