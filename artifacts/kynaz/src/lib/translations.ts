export type Lang = "en" | "bm";

const translations: Record<string, Record<Lang, string>> = {
  "nav.home": { en: "Home", bm: "Utama" },
  "nav.services": { en: "Services", bm: "Perkhidmatan" },
  "nav.about": { en: "About", bm: "Tentang Kami" },
  "nav.contact": { en: "Contact", bm: "Hubungi Kami" },
  "nav.login": { en: "Login", bm: "Log Masuk" },
  "nav.register": { en: "Register", bm: "Daftar" },
  "nav.dashboard": { en: "Dashboard", bm: "Papan Pemuka" },
  "nav.logout": { en: "Logout", bm: "Log Keluar" },

  "logout.title": { en: "Confirm Logout", bm: "Sahkan Log Keluar" },
  "logout.desc": { en: "Are you sure you want to log out of Kynaz Enterprise Portal?", bm: "Adakah anda pasti mahu log keluar daripada Portal Kynaz Enterprise?" },
  "logout.confirm": { en: "Yes, Logout", bm: "Ya, Log Keluar" },
  "logout.cancel": { en: "Cancel", bm: "Batal" },

  "service.requestQuotation": { en: "Request Quotation", bm: "Mohon Sebut Harga" },
  "service.registerCashback": { en: "Register for Cashback", bm: "Daftar untuk Cashback" },
  "service.getQuotation": { en: "Get a Quotation", bm: "Dapatkan Sebut Harga" },
  "service.quotationDesc": { en: "Request a free quotation now. Our team will get back to you promptly.", bm: "Mohon sebut harga percuma sekarang. Pasukan kami akan menghubungi anda dengan segera." },
  "service.needHelp": { en: "Need help? WhatsApp us at", bm: "Perlukan bantuan? WhatsApp kami di" },
  "service.overview": { en: "Service Overview", bm: "Gambaran Perkhidmatan" },
  "service.benefits": { en: "Benefits", bm: "Manfaat" },
  "service.requiredDocs": { en: "Required Documents", bm: "Dokumen Diperlukan" },
  "service.backToServices": { en: "Back to Services", bm: "Kembali ke Perkhidmatan" },
  "service.notFound": { en: "Service not found.", bm: "Perkhidmatan tidak dijumpai." },
};

export function translate(key: string, lang: Lang): string {
  return translations[key]?.[lang] ?? translations[key]?.["en"] ?? key;
}
