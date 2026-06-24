export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: [22, 26], md: [30, 34], lg: [42, 48] }[size];
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <svg width={dims[0]} height={dims[1]} viewBox="0 0 40 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mGrad" x1="0" y1="0" x2="40" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4338CA" />
            <stop offset="0.55" stopColor="#6D28D9" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <polyline
          points="3,43 3,5 20,26 37,5 37,43"
          stroke="url(#mGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span
        className="font-bold text-brand-900 tracking-tight"
        style={{ fontSize: size === 'sm' ? 16 : size === 'lg' ? 26 : 20 }}
      >
        miova
      </span>
    </div>
  );
}
