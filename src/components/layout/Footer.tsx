import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 页面底部组件
 *
 * 极简玻璃风格版权信息栏。
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'glass-card mx-auto max-w-7xl mt-4 px-5 py-3',
        'flex flex-col items-center justify-between gap-2 sm:flex-row',
      )}
    >
      <p className="text-sm text-white/50">
        &copy; {currentYear} VPS 剩余价值计算器. All rights reserved.
      </p>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/80"
      >
        <ExternalLink className="h-4 w-4" />
        <span>GitHub</span>
      </a>
    </footer>
  );
}
