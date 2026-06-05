import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme, type Theme } from './ThemeProvider';

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '自动', icon: Monitor },
];

/**
 * 主题切换按钮
 *
 * 动态图标按钮，支持 dark / light / system 三种模式切换。
 * 使用 Portal 渲染下拉菜单，避免层叠上下文遮挡。
 *
 * 可访问性支持：
 * - 键盘导航：ArrowUp/ArrowDown 切换选项，Enter 选择，Escape 关闭
 * - ARIA：role="button" + aria-expanded + aria-haspopup="menu"
 * - Focus 管理：关闭时 focus 返回 trigger
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentOption = themeOptions.find((t) => t.value === theme) || themeOptions[0];
  const Icon = currentOption.icon;

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 112, // w-28 = 112px, right aligned
      });
    }
  };

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    const currentIdx = themeOptions.findIndex((t) => t.value === theme);
    setActiveIndex(currentIdx >= 0 ? currentIdx : 0);
  }, [theme]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(updatePosition);
      });
    }
  }, [isOpen]);

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
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // 键盘导航
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          if (activeIndex >= 0 && activeIndex < themeOptions.length) {
            setTheme(themeOptions[activeIndex].value);
            closeDropdown();
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) => (prev < themeOptions.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : themeOptions.length - 1));
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
          setActiveIndex(themeOptions.length - 1);
        }
        break;
    }
  };

  const handleOptionClick = (optionValue: Theme) => {
    setTheme(optionValue);
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10',
          'bg-white/[0.06] text-white/70 transition-all hover:bg-white/10 hover:text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-400/50'
        )}
        aria-label={`当前主题: ${currentOption.label}，点击切换`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`当前: ${currentOption.label}模式`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          role="menu"
          className="glass-dropdown fixed rounded-xl border shadow-xl overflow-hidden z-[9999]"
          style={{
            top: position.top,
            left: position.left,
            width: '112px',
          }}
        >
          {themeOptions.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="menuitem"
              aria-current={theme === option.value ? 'true' : undefined}
              onClick={() => handleOptionClick(option.value)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                theme === option.value
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
                index === activeIndex && 'bg-white/10'
              )}
            >
              <option.icon className="h-4 w-4" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
