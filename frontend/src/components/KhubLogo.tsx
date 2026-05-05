const KhubLogo = ({ size = 40, showText = true }: { size?: number; showText?: boolean }) => {
  const scale = size / 120;
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5A0FC8" />
            <stop offset="100%" stopColor="#2E005F" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="120" height="120" rx="32" fill="url(#gradPurple)" />
        <path d="M40 30 V90 M40 60 L85 30 M40 60 L85 90" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="85" y1="30" x2="100" y2="55" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
        <line x1="85" y1="90" x2="100" y2="65" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
        <circle cx="100" cy="55" r="7" fill="#FFFFFF" />
        <circle cx="85" cy="30" r="5" fill="#FFFFFF" />
        <circle cx="85" cy="90" r="5" fill="#FFFFFF" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-gradient-purple">Khub</span>
          <span className="text-[8px] font-medium tracking-[2px] text-muted-foreground uppercase">Your No. 1 Business Hub</span>
        </div>
      )}
    </div>
  );
};

export default KhubLogo;
