import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Car, Plane, Users, Home as HomeIcon, Shield, HardHat, Briefcase, Stethoscope, Heart, CreditCard, FileSearch } from "lucide-react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/context/LanguageContext";

const bannerBg = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop";

const serviceList = [
  { id: "road-tax-renewal", nameKey: "svc.roadTax", icon: Car, descKey: "svc.roadTax.desc" },
  { id: "travel-insurance", nameKey: "svc.travel", icon: Plane, descKey: "svc.travel.desc" },
  { id: "foreign-worker-insurance", nameKey: "svc.foreignWorker", icon: Users, descKey: "svc.foreignWorker.desc" },
  { id: "home-protection", nameKey: "svc.home", icon: HomeIcon, descKey: "svc.home.desc" },
  { id: "public-liability", nameKey: "svc.publicLiability", icon: Shield, descKey: "svc.publicLiability.desc" },
  { id: "contractor-all-risks", nameKey: "svc.contractor", icon: HardHat, descKey: "svc.contractor.desc" },
  { id: "workmen-compensation", nameKey: "svc.workmen", icon: Briefcase, descKey: "svc.workmen.desc" },
  { id: "medical-malpractice", nameKey: "svc.malpractice", icon: Stethoscope, descKey: "svc.malpractice.desc" },
  { id: "general-takaful", nameKey: "svc.takaful", icon: Heart, descKey: "svc.takaful.desc" },
  { id: "hibah-medical-card", nameKey: "svc.hibah", icon: CreditCard, descKey: "svc.hibah.desc" },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${bannerBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/70 to-primary/50" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/20 border border-secondary/40 rounded-full text-secondary text-sm font-medium mb-8"
          >
            <Shield size={14} />
            {t("home.badge")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold max-w-4xl leading-tight mb-6"
          >
            {t("home.hero.title1")} <span className="text-secondary">{t("home.hero.title2")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mb-10"
          >
            {t("home.hero.desc")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto h-14 px-8 text-base"
              onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("home.hero.explore")}
            </Button>
            <Link href="/quote">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground w-full sm:w-auto h-14 px-8 text-base gap-2">
                <FileSearch size={18} />
                {t("home.hero.quote")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">{t("home.services.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("home.services.desc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {serviceList.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/services/${service.id}`} className="block h-full">
                    <div className="bg-card border border-border p-6 rounded-xl h-full hover:shadow-lg hover:border-secondary/50 transition-all group flex flex-col">
                      <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors mb-4">
                        <Icon size={24} />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-foreground">{t(service.nameKey)}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{t(service.descKey)}</p>
                      <div className="flex items-center text-sm font-medium text-primary group-hover:text-secondary mt-auto">
                        {t("home.services.learnMore")} <ArrowRight size={16} className="ml-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">{t("home.faq.title")}</h2>
            <p className="text-muted-foreground">{t("home.faq.desc")}</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq.q1")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq.a1")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq.q2")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq.a2")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq.q3")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq.a3")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq.q4")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq.a4")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">{t("home.faq.q5")}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {t("home.faq.a5")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </PublicLayout>
  );
}
