import { motion } from "framer-motion";
import KhubLogo from "./KhubLogo";

const LoadingScreen = () => (
  <motion.div
    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gradient-purple"
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6 }}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6"
    >
      <svg width="100" height="100" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="120" height="120" rx="32" fill="rgba(255,255,255,0.15)" />
        <path d="M40 30 V90 M40 60 L85 30 M40 60 L85 90" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="85" y1="30" x2="100" y2="55" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
        <line x1="85" y1="90" x2="100" y2="65" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
        <circle cx="100" cy="55" r="7" fill="#FFFFFF" />
        <circle cx="85" cy="30" r="5" fill="#FFFFFF" />
        <circle cx="85" cy="90" r="5" fill="#FFFFFF" />
      </svg>
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground">Khub</h1>
        <p className="text-xs tracking-[3px] text-primary-foreground/70 uppercase mt-1">Your No. 1 Business Hub</p>
      </div>
      <motion.div
        className="w-48 h-1 rounded-full bg-primary-foreground/20 overflow-hidden mt-4"
      >
        <motion.div
          className="h-full rounded-full bg-primary-foreground"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  </motion.div>
);

export default LoadingScreen;
