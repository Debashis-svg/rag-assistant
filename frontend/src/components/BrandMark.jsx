import { Sparkles } from 'lucide-react';

function BrandMark({ size = 'default' }) {
  const compact = size === 'compact';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center text-cyan-300 ${compact ? 'h-10 w-10' : 'h-11 w-11'}`}
      aria-hidden="true"
    >
      <Sparkles size={compact ? 18 : 21} strokeWidth={2.2} />
    </div>
  );
}

export default BrandMark;
