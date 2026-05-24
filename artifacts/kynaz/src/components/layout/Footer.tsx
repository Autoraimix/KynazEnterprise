export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-10">
      <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="KYNAZ" className="h-10 w-auto object-contain bg-white/10 rounded-md p-1" />
          <span className="font-bold text-xl text-secondary">KYNAZ</span>
        </a>
        <p className="text-primary-foreground/70 text-sm max-w-sm">
          A trusted financial services intermediary in Malaysia, providing precise, professional, and reliable insurance and takaful solutions.
        </p>
        <p className="text-primary-foreground/50 text-xs mt-2">
          &copy; {new Date().getFullYear()} KYNAZ Enterprise. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
