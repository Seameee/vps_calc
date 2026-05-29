import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 页面头部组件
 *
 * Glassmorphism 风格的应用标题栏。
 */
export function Header() {
  return (
    <header
      className={cn(
        'glass-card mx-auto max-w-7xl mb-8 px-6 py-5',
        'flex items-center gap-4',
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-400 shadow-lg">
        <Server className="h-6 w-6 text-white" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-white/95">
          VPS 剩余价值计算器
        </h1>
        <p className="mt-0.5 text-sm text-white/60">
          精确计算 VPS 订阅剩余价值，支持实时汇率与交易帖生成
        </p>
      </div>
    </header>
  );
}
