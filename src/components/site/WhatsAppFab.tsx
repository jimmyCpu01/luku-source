import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function WhatsAppFab() {
  return (
    <motion.a href="https://wa.me/254700408174?text=Hi%20Luku%20Legit%2C%20I%27m%20interested" target="_blank" rel="noreferrer"
      initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6, type: "spring" }}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-[var(--neon-glow)]"
      aria-label="Chat on WhatsApp">
      <MessageCircle className="size-6" />
      <span className="absolute inset-0 rounded-full animate-ping bg-primary/40" />
    </motion.a>
  );
}