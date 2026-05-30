import { useState, useRef, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
 * 玻璃态美化下拉选择组件（使用 Portal 避免层叠上下文遮挡）
 */
export function GlassSelect({ value, onChange, options, placeholder, className, disabled }: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectedOption = options.find((o) => o.value === value);

  // 计算下拉菜单位置
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // 使用 requestAnimationFrame 确保 DOM 已渲染
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePosition);
      });
    }
  }, [isOpen]);

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 窗口大小/滚动变化时重新计算位置
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
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

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="glass-dropdown fixed overflow-hidden rounded-lg border shadow-xl z-[9999]"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
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
        </div>,
        document.body
      )}
    </div>
  );
}
