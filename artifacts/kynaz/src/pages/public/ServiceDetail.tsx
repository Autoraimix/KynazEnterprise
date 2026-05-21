import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetService } from "@workspace/api-client-react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, FileText, ArrowLeft, Car, Plane, Users, Home as HomeIcon, Shield, HardHat, Briefcase, Stethoscope, Heart, CreditCard, ArrowRight } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Car, Plane, Users, Home: HomeIcon, Shield, HardHat, Briefcase, Stethoscope, Heart, CreditCard
};

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:slug");
  const slug = params?.slug;

  const { data: services, isLoading } = useListServices();
  const service = services?.find(s => s.slug === slug);
  const { user } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <Skeleton className="h-64 rounded-xl mb-8" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </PublicLayout>
    );
  }

  if (!service) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
          <FileText size={48} className="mx-auto mb-4 text-muted-foreground/40" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">{t("service.notFound")}</h1>
          <Link href="/services">
            <Button variant="outline" className="gap-2 mt-4">
              <ArrowLeft size={16} /> {t("service.backToServices")}
            </Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const IconComponent = iconMap[service.icon] ?? Shield;
  const quotationHref = user ? "/dashboard/quotations/new" : "/quote";

  return (
    <PublicLayout>
      <section className="py-8 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link href="/services">
              <Button variant="outline" size="sm" className="gap-2 mb-6">
                <ArrowLeft size={16} /> {t("service.backToServices")}
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <IconComponent size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">{service.name}</h1>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">{service.category}</span>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h2 className="text-xl font-serif font-semibold text-foreground mb-3">{t("service.overview")}</h2>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>

              {service.benefits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-xl font-serif font-semibold text-foreground mb-4">{t("service.benefits")}</h2>
                  <ul className="space-y-3">
                    {service.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {service.requiredDocuments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <h2 className="text-xl font-serif font-semibold text-foreground mb-4">{t("service.requiredDocs")}</h2>
                  <ul className="space-y-3">
                    {service.requiredDocuments.map((doc, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FileText size={16} className="text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-primary text-white rounded-2xl p-6 sticky top-24"
              >
                <h3 className="font-serif font-bold text-xl mb-3">{t("service.getQuotation")}</h3>
                <p className="text-white/70 text-sm mb-6 leading-relaxed">
                  {t("service.quotationDesc")}
                </p>
                <Link href={quotationHref}>
                  <Button className="w-full bg-secondary text-white hover:bg-secondary/90 h-11 font-semibold">
                    {t("service.requestQuotation")} <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="w-full mt-3 border-white/30 text-white hover:bg-white/10 h-11">
                    {t("service.registerCashback")}
                  </Button>
                </Link>
                <div className="mt-6 pt-4 border-t border-white/20">
                  <p className="text-white/60 text-xs text-center">{t("service.needHelp")}</p>
                  <p className="text-white text-sm text-center font-semibold">+6019-359 0501</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
