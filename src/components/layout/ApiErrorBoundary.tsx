import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { ApiError } from '@/types/error';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * API 错误边界
 *
 * 捕获子树中所有 API 相关的未处理异常，
 * 展示友好的错误提示而非白屏。
 */
export class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const apiError = error as ApiError;
    console.error(
      `[ApiErrorBoundary] ${apiError.category ?? 'unknown'}: ${error.message}`,
      errorInfo,
    );
    this.props.onError?.(error, errorInfo);
  }

  private _handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const apiError = this.state.error as ApiError;
      const categoryTitle =
        apiError.category === 'network'
          ? '网络连接异常'
          : apiError.category === 'timeout'
            ? '请求超时'
            : '服务暂时不可用';

      return (
        <div
          className={cn(
            'glass-card mx-auto mt-20 max-w-md p-8 text-center',
            'flex flex-col items-center gap-4',
          )}
          role="alert"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold text-white/95">{categoryTitle}</h3>
            <p className="text-sm text-white/60">
              {this.state.error?.message ?? '请检查网络后重试'}
            </p>
          </div>
          <button
            onClick={this._handleRetry}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5',
              'bg-white/10 text-sm font-medium text-white/95',
              'transition-all duration-200 hover:bg-white/20',
            )}
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
