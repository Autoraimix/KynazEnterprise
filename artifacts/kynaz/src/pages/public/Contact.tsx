import { PublicLayout } from "@/components/layout/PublicLayout";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WA_NUMBER = "60132727237";
const WA_MESSAGE = encodeURIComponent(
  "Hai Kynaz, saya ingin membuat pertanyaan mengenai:\nTakaful dan Insurance yang kynaz provide."
);

export default function Contact() {
  return (
    <PublicLayout>
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-background py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-24 h-24 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle size={48} className="text-[#25D366]" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Contact Us</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Have a question or need a quotation? Chat with us directly on WhatsApp — our team is ready to help you right away.
          </p>
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#20b954] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
          >
            <MessageCircle size={24} />
            WhatsApp Us
          </a>
          <p className="text-muted-foreground text-sm mt-5 font-medium">+6013-272 7237</p>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
