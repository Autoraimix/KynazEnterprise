import { PublicLayout } from "@/components/layout/PublicLayout";
import { useListServices } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Car, Plane, Users, Home as HomeIcon, Shield, HardHat, Briefcase, Stethoscope, Heart, CreditCard } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Car, Plane, Users, Home: HomeIcon, Shield, HardHat, Briefcase, Stethoscope, Heart, CreditCard
};

export default function Services() {
  const { data: services, isLoading } = useListServices();

  return (
    <PublicLayout>
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-4"
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/70 text-lg max-w-xl mx-auto"
          >
            Comprehensive insurance, takaful, and compliance solutions tailored for Malaysian businesses and individuals.
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.map((service, i) => {
                const Icon = iconMap[service.icon] ?? Shield;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/services/${service.slug}`}>
                      <div
                        data-testid={`card-service-${service.id}`}
                        className="group bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full flex flex-col"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                          <Icon size={24} className="text-primary group-hover:text-secondary transition-colors" />
                        </div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{service.category}</span>
                        </div>
                        <h3 className="font-semibold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                        <p className="text-muted-foreground text-sm flex-1 leading-relaxed">{service.description}</p>
                        <div className="flex items-center gap-1 text-primary text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                          Get Quotation <ArrowRight size={16} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-primary/5 border-y border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Register as a member to earn cashback rewards on every service purchase.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12">Create Free Account</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="px-8 h-12">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
