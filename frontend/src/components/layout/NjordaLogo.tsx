interface NjordaLogoProps {
  collapsed?: boolean;
}

export function NjordaLogo({ collapsed }: NjordaLogoProps) {
  if (collapsed) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#1B4F8A" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill="white"
          fontFamily="system-ui, sans-serif"
          fontSize="16"
          fontWeight="700"
          letterSpacing="0.5"
        >
          S
        </text>
      </svg>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2.5">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#1B4F8A" />
          <text
            x="16"
            y="22"
            textAnchor="middle"
            fill="white"
            fontFamily="system-ui, sans-serif"
            fontSize="16"
            fontWeight="700"
            letterSpacing="0.5"
          >
            S
          </text>
        </svg>
        <span className="text-lg font-bold tracking-wide text-[#1B4F8A]" style={{ fontFamily: "system-ui, sans-serif" }}>
          SÄKRA
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground pl-[42px] -mt-0.5">
        Powered by Njorda
      </span>
    </div>
  );
}
