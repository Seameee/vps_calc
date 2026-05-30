import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

/**
 * 页面头部组件
 *
 * Glassmorphism 风格的应用标题栏。
 */
export function Header() {
  return (
    <header
      className={cn(
        'glass-card mx-auto max-w-7xl mb-4 px-5 py-4',
        'flex items-center justify-between gap-3',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] border border-white/10">
          <Server className="h-5 w-5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-white/95">
            VPS 剩余价值计算器
          </h1>
          <p className="text-xs text-white/50">
            精确计算剩余价值，支持实时汇率与交易帖生成
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
