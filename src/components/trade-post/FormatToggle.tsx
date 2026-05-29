import { cn } from '@/lib/utils';
import type { TradePostFormat } from '@/types/trade';

interface FormatToggleProps {
  format: TradePostFormat;
  onChange: (format: TradePostFormat) => void;
}

export function FormatToggle({ format, onChange }: FormatToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-xl bg-white/5 p-1 border border-white/10"
      role="group"
      aria-label="格式切换"
    >
      <button
        type="button"
        onClick={() => onChange('plain')}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
          format === 'plain'
            ? 'bg-blue-400 text-white shadow-sm'
            : 'text-white/70 hover:text-white/90'
        )}
        aria-pressed={format === 'plain'}
      >
        纯文本
      </button>
      <button
        type="button"
        onClick={() => onChange('markdown')}
        className={cn(
          'px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
          format === 'markdown'
            ? 'bg-blue-400 text-white shadow-sm'
            : 'text-white/70 hover:text-white/90'
        )}
        aria-pressed={format === 'markdown'}
      >
        Markdown
      </button>
    </div>
  );
}
