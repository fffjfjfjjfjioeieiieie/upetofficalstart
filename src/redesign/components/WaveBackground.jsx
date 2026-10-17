const wavePath = (amp, len, y) => {
  let d = `M 0 ${y}`;
  for (let x = 0; x < 3200; x += len) d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`;
  return d;
};

const LINES = [
  { y: 0.3, amp: 46, len: 420, op: 0.22 },
  { y: 0.52, amp: 64, len: 560, op: 0.14 },
  { y: 0.74, amp: 38, len: 360, op: 0.1 },
];

export const WaveBackground = () => (
  <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" data-testid="wave-background">
    <div className="absolute inset-0" style={{ background: "radial-gradient(60% 45% at 50% 0%, hsl(var(--primary) / .10), transparent 70%)" }} />
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="none">
      {LINES.map((l, i) => (
        <path key={i} d={wavePath(l.amp, l.len, l.y * 1000)} fill="none" stroke={`hsl(var(--wave) / ${l.op})`} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  </div>
);
