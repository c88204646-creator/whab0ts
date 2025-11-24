export function WhatsBot() {
  return (
    <svg
      viewBox="0 0 128 128"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="bolt-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="circle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="64" cy="64" r="62" fill="url(#circle-gradient)" opacity="0.1" />
      <circle cx="64" cy="64" r="58" fill="url(#circle-gradient)" />

      {/* Chat bubble base */}
      <path
        d="M 28 36 L 28 88 Q 28 96 36 96 L 88 96 Q 96 96 96 88 L 96 52 Q 96 44 88 44 L 36 44 Q 28 44 28 52 L 28 36 Z"
        fill="white"
        opacity="0.95"
      />

      {/* Chat bubble tail */}
      <path
        d="M 30 92 L 22 104 L 34 96 Q 32 96 30 96 Z"
        fill="white"
        opacity="0.95"
      />

      {/* Lightning bolt (rayo) */}
      <g>
        {/* Outer bolt glow */}
        <path
          d="M 64 34 L 72 54 L 60 54 L 72 78 L 52 62 L 62 62 Z"
          fill="url(#bolt-gradient)"
          opacity="1"
          filter="drop-shadow(0 2px 4px rgba(251, 191, 36, 0.4))"
        />
        {/* Inner bold bolt */}
        <path
          d="M 64 36 L 70 52 L 62 52 L 70 74 L 56 62 L 64 62 Z"
          fill="#fcd34d"
          opacity="1"
        />
      </g>

      {/* Highlight reflection */}
      <circle cx="42" cy="52" r="6" fill="white" opacity="0.4" />
    </svg>
  );
}
