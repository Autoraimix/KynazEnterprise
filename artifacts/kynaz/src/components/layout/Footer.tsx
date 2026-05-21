import { Link } from "wouter";
import { Mail, MapPin, Phone } from "lucide-react";
import logoUrl from "@assets/Kynaz_Enterprise_Logo_1778916756969.jpeg";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 md:py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <img src={logoUrl} alt="Kynaz Enterprise" className="h-10 w-auto object-contain bg-white rounded-md p-1" />
            <span className="font-serif font-bold text-xl text-secondary">
              Kynaz Enterprise
            </span>
          </Link>
          <p className="text-primary-foreground/70 text-sm mb-6 max-w-xs">
            A trusted financial services intermediary in Malaysia, providing precise, professional, and reliable insurance and takaful solutions.
          </p>
        </div>

        <div>
          <h3 className="font-serif text-lg font-semibold text-secondary mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link href="/" className="hover:text-secondary transition-colors">Home</Link></li>
            <li><Link href="/services" className="hover:text-secondary transition-colors">Services</Link></li>
            <li><Link href="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-lg font-semibold text-secondary mb-4">Services</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link href="/services/road-tax-renewal" className="hover:text-secondary transition-colors">Road Tax Renewal</Link></li>
            <li><Link href="/services/travel-insurance" className="hover:text-secondary transition-colors">Travel Insurance</Link></li>
            <li><Link href="/services/foreign-worker" className="hover:text-secondary transition-colors">Foreign Worker</Link></li>
            <li><Link href="/services/home-household" className="hover:text-secondary transition-colors">Home & Household</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-serif text-lg font-semibold text-secondary mb-4">Contact</h3>
          <ul className="space-y-4 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-secondary shrink-0 mt-0.5" />
              <span>Suite 12.01, Level 12, Menara Kynaz, Jalan Sultan Ismail, 50250 Kuala Lumpur, Malaysia</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-secondary shrink-0" />
              <span>+6019-359 0501</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-secondary shrink-0" />
              <span>hello@kynaz.com.my</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/60 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Kynaz Enterprise. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-secondary transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
