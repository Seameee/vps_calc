import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import type { CurrencyCode } from '@/types/currency';

interface ExchangeRateDisplayProps {
  base: CurrencyCode;
  target: CurrencyCode;
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'cache':
      return '缓存';
    case 'open-er':
      return 'Open ER API';
    case 'exchange-rate-api':
      return 'ExchangeRate-API';
    case 'fallback':
      return '备用汇率';
    default:
      return source;
  }
}

export function ExchangeRateDisplay({ base, target }: ExchangeRateDisplayProps) {
  const { data, loading, error, refetch } = useExchangeRate(base);
  const rate = data?.rates?.[target];

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {loading && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" aria-hidden="true" />
        )}
        {!loading && data?.isFallback && (
          <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        )}
        {!loading && !data?.isFallback && data && (
          <div className="h-5 w-5 rounded-full bg-green-400/20 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
        )}
        {!loading && !data && !error && (
          <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-white/30" />
          </div>
        )}

        <div className="flex flex-col">
          {loading ? (
            <span className="text-sm text-white/70">获取汇率中...</span>
          ) : error ? (
            <span className="text-sm text-red-400">获取失败: {error.message}</span>
          ) : rate !== undefined ? (
            <span className="text-sm text-white/95">
              1 {base} ≈ {rate.toFixed(4)} {target}
            </span>
          ) : (
            <span className="text-sm text-white/70">--</span>
          )}

          {data && (
            <span
              className={cn(
                'text-xs',
                data.isFallback ? 'text-yellow-400' : 'text-white/50'
              )}
            >
              来源: {getSourceLabel(data.source)}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => refetch()}
        disabled={loading}
        aria-label="刷新汇率"
      >
        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      </Button>
    </div>
  );
}
