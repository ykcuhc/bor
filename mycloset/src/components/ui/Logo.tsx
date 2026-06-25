interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  invert?: boolean;
}

export default function Logo({ size = 'md', invert = false }: LogoProps) {
  const wordmarkSize = { sm: 18, md: 22, lg: 30 }[size];
  const subSize = { sm: 7, md: 8, lg: 11 }[size];
  const color = invert ? '#ffffff' : '#111827';

  return (
    <div className="flex-shrink-0 inline-flex flex-col" style={{ gap: 2 }}>
      <span
        className="leading-none tracking-tight"
        style={{
          fontSize: wordmarkSize,
          color,
          fontFamily: 'var(--font-nunito), ui-sans-serif, system-ui, sans-serif',
          fontWeight: 900,
        }}
      >
        Miova.
      </span>
      <div className="flex items-center justify-between" style={{ gap: 6 }}>
        <span
          className="font-semibold leading-none tracking-widest uppercase"
          style={{ fontSize: subSize, color, opacity: 0.5, letterSpacing: '0.12em' }}
        >
          Marketplace
        </span>
        <span
          className="font-semibold leading-none tracking-widest uppercase"
          style={{ fontSize: subSize, color, opacity: 0.5, letterSpacing: '0.12em' }}
        >
          Est. 2026
        </span>
      </div>
    </div>
  );
}
