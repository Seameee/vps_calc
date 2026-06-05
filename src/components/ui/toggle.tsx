import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

/**
 * 精美的 Toggle Switch 开关组件
 *
 * 采用玻璃态风格，带有平滑的位移动画，
 * 作为默认复选框的美化替代方案。
 */
export function Toggle({ checked, onChange, label, description, className }: ToggleProps) {
  return (
    <div
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10',
        'bg-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.06]',
        className
      )}
      onClick={() => onChange(!checked)}
    >
      <div className="flex flex-col gap-0.5">
        {label && <span className="text-sm text-white/90">{label}</span>}
        {description && <span className="text-xs text-white/60">{description}</span>}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50',
          checked ? 'bg-blue-500' : 'bg-white/15'
        )}
        aria-checked={checked}
        role="switch"
        aria-label={label}
      >
        <span
          className={cn(
            'absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}
