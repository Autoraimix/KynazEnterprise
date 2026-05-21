import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Car, Plane, Users, Home as HomeIcon, Shield, HardHat, Briefcase, Stethoscope, Heart, CreditCard, CheckCircle2, FileSearch } from "lucide-react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const bannerBg = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop";

const services = [
  { id: "road-tax-renewal", name: "Road Tax Renewal", icon: Car, desc: "Quick and hassle-free road tax renewal services." },
  { id: "travel-insurance", name: "Travel Insurance/Takaful", icon: Plane, desc: "Comprehensive coverage for your global travels." },
  { id: "foreign-worker", name: "Foreign Worker Insurance", icon: Users, desc: "Mandatory protection for your foreign workforce." },
  { id: "home-household", name: "Home & Household Protection", icon: HomeIcon, desc: "Safeguard your most valuable asset." },
  { id: "public-liability", name: "Public Liability Insurance", icon: Shield, desc: "Protect your business from third-party claims." },
  { id: "contractor-all-risks", name: "Contractor All Risks", icon: HardHat, desc: "All-round protection for construction projects." },
  { id: "workmen-compensation", name: "Workmen Compensation", icon: Briefcase, desc: "Fulfill statutory requirements for your employees." },
  { id: "medical-malpractice", name: "Medical Malpractice", icon: Stethoscope, desc: "Professional liability for healthcare providers." },
  { id: "general-takaful", name: "General Takaful Services", icon: Heart, desc: "Shariah-compliant insurance alternatives." },
  { id: "hibah-medical", name: "Hibah & Medical Card", icon: CreditCard, desc: "Secure your family's future and health." },
];

export default function Home() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden py-24 lg:py-32">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${bannerBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/20 border border-secondary/40 rounded-full text-secondary text-sm font-medium mb-8"
          >
            <Shield size={14} />
            Malaysia's Trusted Insurance & Takaful Portal
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold max-w-4xl leading-tight mb-6"
          >
            Premium Protection, <span className="text-secondary">Rewarding Returns.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mb-10"
          >
            Malaysia's most trusted integrated service portal for insurance, takaful, and compliance needs. Earn cashback on every transaction.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/services">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto h-14 px-8 text-base">
                Explore Services
              </Button>
            </Link>
            <Link href="/quote">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground w-full sm:w-auto h-14 px-8 text-base gap-2">
                <FileSearch size={18} />
                Get Free Quote
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="ghost" className="hover:bg-primary-foreground/10 text-primary-foreground/80 w-full sm:w-auto h-14 px-8 text-base">
                Register for Cashback
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive protection solutions tailored for individuals and businesses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {services.map((service, index) => {
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
                      <h3 className="font-bold text-lg mb-2 text-foreground">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{service.desc}</p>
                      <div className="flex items-center text-sm font-medium text-primary group-hover:text-secondary mt-auto">
                        Learn more <ArrowRight size={16} className="ml-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Guest Quote CTA */}
      <section className="py-12 bg-secondary/5 border-y border-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="text-2xl font-serif font-bold text-primary mb-3">No Account? No Problem.</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Get a free quotation without registering. Simply fill in your details and our team will get back to you promptly.
            </p>
            <Link href="/quote">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 px-8 gap-2">
                <FileSearch size={18} />
                Get Free Quotation — No Login Required
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Cashback Promo */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 md:p-16 flex flex-col justify-center">
                <div className="inline-block px-4 py-1.5 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-sm font-medium mb-6 w-max">
                  Kynaz Rewards
                </div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-primary-foreground mb-6">
                  Earn up to 10% Cashback on Every Service.
                </h2>
                <p className="text-primary-foreground/80 mb-8 text-lg">
                  Join our premium membership portal. Get fast quotations, track your policies, and earn real cashback that you can withdraw directly to your bank account.
                </p>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="text-secondary" />
                    <span>Register for free in 60 seconds</span>
                  </div>
                  <div className="flex items-center gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="text-secondary" />
                    <span>Purchase any insurance or service</span>
                  </div>
                  <div className="flex items-center gap-3 text-primary-foreground/90">
                    <CheckCircle2 className="text-secondary" />
                    <span>Earn cashback automatically to your wallet</span>
                  </div>
                </div>

                <Link href="/register">
                  <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8 text-base">
                    Create Free Account
                  </Button>
                </Link>
              </div>
              <div
                className="relative min-h-[400px] hidden lg:block bg-cover bg-center"
                style={{ backgroundImage: `url(${bannerBg})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-primary mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about Kynaz Enterprise.</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">How fast can I get a quotation?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                For standard services like Road Tax Renewal or Travel Insurance, quotations are typically provided within 10-15 minutes during business hours. Complex business insurances may take up to 24 hours for accurate underwriting.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">Can I get a quotation without an account?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes! Use our "Get Free Quotation" option on the homepage. Simply provide your contact details and our team will reach out with a quote. Note that cashback rewards are only available for registered members.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">How does the cashback system work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Once you register an account, any service you purchase through our portal automatically earns cashback into your digital wallet. The percentage varies by service. You can withdraw this balance to your Malaysian bank account or use it to offset future purchases.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">Are your services Shariah-compliant?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes, we offer a wide range of Takaful (Islamic insurance) options alongside conventional insurance products. You can specify your preference when requesting a quotation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">What documents do I need for Foreign Worker Insurance?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Typically, you will need a copy of the passport, work permit, and employment contract. Specific requirements are detailed on the individual service pages.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </PublicLayout>
  );
}
