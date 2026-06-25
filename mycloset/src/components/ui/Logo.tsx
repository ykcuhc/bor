interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  invert?: boolean;
}

export default function Logo({ size = 'md', invert = false }: LogoProps) {
  const wordmarkSize = { sm: 20, md: 26, lg: 36 }[size];
  const color = invert ? '#ffffff' : '#111827';

  return (
    <span
      className="flex-shrink-0"
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
  );
}
