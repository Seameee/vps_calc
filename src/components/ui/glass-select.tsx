import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 玻璃态美化下拉选择组件
 *
 * 自定义下拉菜单，适配深色主题，带有玻璃态效果和平滑动画。
 */
export function GlassSelect({ value, onChange, options, placeholder, className, disabled }: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg border border-white/[0.12] bg-white/[0.06] px-3',
          'text-sm text-white/95 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen && 'border-blue-400'
        )}
      >
        <span className={cn(!selectedOption && 'text-white/50')}>{selectedOption?.label ?? placeholder ?? '请选择'}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-white/50 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/10',
            'bg-[#0f172a]/95 backdrop-blur-xl shadow-xl'
          )}
        >
          <div className="max-h-60 overflow-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                disabled={option.disabled}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                  value === option.value
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                  option.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
