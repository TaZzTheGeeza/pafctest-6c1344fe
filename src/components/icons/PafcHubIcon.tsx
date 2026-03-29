interface PafcHubIconProps {
  className?: string;
}

export function PafcHubIcon({ className = "h-4 w-4" }: PafcHubIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Shield outline */}
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V6L12 2z" />
      {/* Connected hub nodes inside */}
      <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14" r="1" fill="currentColor" stroke="none" />
      <line x1="12" y1="11.5" x2="8.5" y2="13" strokeWidth="1.5" />
      <line x1="12" y1="11.5" x2="15.5" y2="13" strokeWidth="1.5" />
      <line x1="8.5" y1="14" x2="15.5" y2="14" strokeWidth="1.5" />
    </svg>
  );
}
