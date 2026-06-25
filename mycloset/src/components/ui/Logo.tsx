interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  invert?: boolean;
}

export default function Logo({ size = 'md', invert = false }: LogoProps) {
  const wordmarkSize = { sm: 16, md: 20, lg: 28 }[size];
  const subSize = { sm: 4.5, md: 5, lg: 6.5 }[size];
  const color = invert ? '#ffffff' : '#111827';

  return (
    <div className="flex-shrink-0" style={{ display: 'inline-block' }}>
      <span
        style={{
          display: 'block',
          fontSize: wordmarkSize,
          color,
          fontFamily: 'var(--font-nunito), ui-sans-serif, system-ui, sans-serif',
          fontWeight: 900,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        Miova.
      </span>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 3,
        }}
      >
        <span
          style={{
            fontSize: subSize,
            color,
            opacity: 0.45,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          Marketplace
        </span>
        <span
          style={{
            fontSize: subSize,
            color,
            opacity: 0.45,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          Est.&nbsp;2026
        </span>
      </div>
    </div>
  );
}
