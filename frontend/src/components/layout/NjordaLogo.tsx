interface NjordaLogoProps {
  collapsed?: boolean;
}

export function NjordaLogo({ collapsed }: NjordaLogoProps) {
  if (collapsed) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#03A48D" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill="white"
          fontFamily="var(--font-brand)"
          fontSize="18"
          fontWeight="500"
        >
          N
        </text>
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#03A48D" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fill="white"
          fontFamily="var(--font-brand)"
          fontSize="18"
          fontWeight="500"
        >
          N
        </text>
      </svg>
      <span className="font-brand text-lg tracking-tight text-foreground">
        Njorda
      </span>
    </div>
  );
}
