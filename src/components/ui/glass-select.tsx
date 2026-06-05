import { useState, useRef, useEffect, type ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface GlassSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * 玻璃态美化下拉选择组件（使用 Portal 避免层叠上下文遮挡）
 *
 * 可访问性支持：
 * - 键盘导航：ArrowUp/ArrowDown 切换选项，Enter 选择，Escape 关闭
 * - ARIA：role="combobox" + role="listbox" + role="option"
 * - Focus 管理：关闭时 focus 返回 trigger
 */
export function GlassSelect({ id, value, onChange, options, placeholder, className, disabled, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy }: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
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

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    const selectedIdx = options.findIndex((o) => o.value === value);
    setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
  }, [disabled, options, value]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    // Focus 返回 trigger
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isOpen) {
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

  // 键盘导航
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          if (activeIndex >= 0 && activeIndex < options.length) {
            onChange(options[activeIndex].value);
            closeDropdown();
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) => {
            const next = prev < options.length - 1 ? prev + 1 : 0;
            return next;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) => {
            const next = prev > 0 ? prev - 1 : options.length - 1;
            return next;
          });
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (isOpen) {
          closeDropdown();
        }
        break;
      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (isOpen) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
  };

  return (
    <div className={cn('relative', className)}>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-lg border border-white/[0.12] bg-white/[0.06] px-3',
          'text-sm text-white/95 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen && 'border-blue-400'
        )}
      >
        <span className={cn(!selectedOption && 'text-white/60')}>{selectedOption?.label ?? placeholder ?? '请选择'}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-white/60 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `option-${options[activeIndex].value}` : undefined}
          className="glass-dropdown fixed overflow-hidden rounded-lg border shadow-xl z-[9999]"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          <div className="max-h-60 overflow-auto py-1">
            {options.map((option, index) => (
              <button
                key={option.value}
                id={`option-${option.value}`}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => handleOptionClick(option.value)}
                disabled={option.disabled}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors',
                  value === option.value
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                  index === activeIndex && 'bg-white/10',
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
