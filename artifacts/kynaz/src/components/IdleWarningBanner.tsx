import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function IdleWarningBanner() {
  const { idleWarning, resetIdle, logout } = useAuth();

  return (
    <AnimatePresence>
      {idleWarning && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 flex items-center justify-between gap-4 shadow-lg"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock size={16} />
            <span>Your session is about to expire due to inactivity. You will be logged out in under 1 minute.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/20 h-7 text-xs"
              onClick={resetIdle}
            >
              <RefreshCw size={12} className="mr-1" /> Stay Logged In
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white/80 hover:bg-white/20 h-7 text-xs"
              onClick={logout}
            >
              Logout Now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
