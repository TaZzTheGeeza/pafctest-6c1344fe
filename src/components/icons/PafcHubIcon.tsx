interface PafcHubIconProps {
  className?: string;
}

export function PafcHubIcon({ className = "h-4 w-4" }: PafcHubIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Hexagon outline */}
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
      {/* Center node */}
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      {/* Connection lines from center to vertices */}
      <line x1="12" y1="10" x2="12" y2="4" strokeWidth="1.4" />
      <line x1="13.7" y1="11" x2="19" y2="8" strokeWidth="1.4" />
      <line x1="13.7" y1="13" x2="19" y2="16" strokeWidth="1.4" />
      <line x1="12" y1="14" x2="12" y2="20" strokeWidth="1.4" />
      <line x1="10.3" y1="13" x2="5" y2="16" strokeWidth="1.4" />
      <line x1="10.3" y1="11" x2="5" y2="8" strokeWidth="1.4" />
      {/* Small dots at connection points */}
      <circle cx="12" cy="3.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="16.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="20.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="16.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
