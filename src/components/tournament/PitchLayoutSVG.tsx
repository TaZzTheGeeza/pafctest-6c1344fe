const PitchLayoutSVG = () => (
  <svg viewBox="0 0 520 400" className="w-full rounded-lg border border-border bg-emerald-700" aria-label="Tournament pitch layout showing 4 numbered pitches, registration gazebo, toilets, and main gate">
    {/* Grass texture stripes */}
    {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((y, i) =>
      i % 2 === 0 ? <rect key={y} x="0" y={y} width="520" height="40" fill="hsl(142, 60%, 28%)" opacity="0.3" /> : null
    )}

    {/* Pitch outlines */}
    {[
      { x: 20, y: 30, label: "3" },
      { x: 270, y: 30, label: "4" },
      { x: 20, y: 210, label: "1" },
      { x: 270, y: 210, label: "2" },
    ].map((pitch) => (
      <g key={pitch.label}>
        {/* Pitch border */}
        <rect x={pitch.x} y={pitch.y} width="230" height="160" rx="2" fill="none" stroke="white" strokeWidth="2" />
        {/* Centre line */}
        <line x1={pitch.x + 115} y1={pitch.y} x2={pitch.x + 115} y2={pitch.y + 160} stroke="white" strokeWidth="1.5" />
        {/* Centre circle */}
        <circle cx={pitch.x + 115} cy={pitch.y + 80} r="25" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx={pitch.x + 115} cy={pitch.y + 80} r="2" fill="white" />
        {/* Left goal area */}
        <rect x={pitch.x} y={pitch.y + 50} width="35" height="60" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x={pitch.x} y={pitch.y + 62} width="14" height="36" fill="none" stroke="white" strokeWidth="1" />
        {/* Right goal area */}
        <rect x={pitch.x + 195} y={pitch.y + 50} width="35" height="60" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x={pitch.x + 216} y={pitch.y + 62} width="14" height="36" fill="none" stroke="white" strokeWidth="1" />
        {/* Corner arcs */}
        <path d={`M${pitch.x + 8},${pitch.y} A8,8 0 0,0 ${pitch.x},${pitch.y + 8}`} fill="none" stroke="white" strokeWidth="1" />
        <path d={`M${pitch.x},${pitch.y + 152} A8,8 0 0,0 ${pitch.x + 8},${pitch.y + 160}`} fill="none" stroke="white" strokeWidth="1" />
        <path d={`M${pitch.x + 222},${pitch.y} A8,8 0 0,1 ${pitch.x + 230},${pitch.y + 8}`} fill="none" stroke="white" strokeWidth="1" />
        <path d={`M${pitch.x + 230},${pitch.y + 152} A8,8 0 0,1 ${pitch.x + 222},${pitch.y + 160}`} fill="none" stroke="white" strokeWidth="1" />
        {/* Pitch number */}
        <text x={pitch.x + 115} y={pitch.y + 86} textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" opacity="0.35" fontFamily="sans-serif">{pitch.label}</text>
      </g>
    ))}

    {/* Facilities - bottom area */}
    {/* Registration Gazebo */}
    <rect x="20" y="378" width="80" height="16" rx="3" fill="hsl(45, 90%, 55%)" stroke="hsl(45, 80%, 40%)" strokeWidth="1" />
    <text x="60" y="389" textAnchor="middle" fill="hsl(45, 80%, 15%)" fontSize="7" fontWeight="bold" fontFamily="sans-serif">REGISTRATION</text>

    {/* First Aid */}
    <rect x="110" y="378" width="56" height="16" rx="3" fill="white" stroke="hsl(0, 70%, 50%)" strokeWidth="1" />
    <text x="122" y="389" fill="hsl(0, 70%, 45%)" fontSize="9" fontWeight="bold" fontFamily="sans-serif">+</text>
    <text x="140" y="389" textAnchor="middle" fill="hsl(0, 70%, 40%)" fontSize="7" fontWeight="bold" fontFamily="sans-serif">FIRST AID</text>

    {/* Food vendor */}
    <rect x="176" y="378" width="50" height="16" rx="3" fill="hsl(25, 80%, 55%)" stroke="hsl(25, 70%, 40%)" strokeWidth="1" />
    <text x="201" y="389" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">FOOD</text>

    {/* Main Gate label - top right */}
    <g>
      <rect x="420" y="2" width="96" height="20" rx="3" fill="hsl(0, 0%, 15%)" />
      <text x="468" y="14" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="sans-serif">MAIN GATE →</text>
    </g>

    {/* Toilets */}
    <rect x="420" y="26" width="96" height="14" rx="3" fill="hsl(210, 50%, 50%)" />
    <text x="468" y="36" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="sans-serif">TOILETS</text>
  </svg>
);

export default PitchLayoutSVG;
