import { useState, useRef, useEffect } from 'react';
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
 * 点击后循环切换主题，图标跟随当前主题变化。
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = themeOptions.find((t) => t.value === theme) || themeOptions[0];
  const Icon = currentOption.icon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10',
          'bg-white/[0.06] text-white/70 transition-all hover:bg-white/10 hover:text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-400/50'
        )}
        aria-label={`当前主题: ${currentOption.label}，点击切换`}
        title={`当前: ${currentOption.label}模式`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-28 rounded-xl border border-white/10',
            'bg-[#0f172a]/95 backdrop-blur-xl shadow-xl overflow-hidden z-50'
          )}
        >
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setTheme(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                theme === option.value
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <option.icon className="h-4 w-4" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
