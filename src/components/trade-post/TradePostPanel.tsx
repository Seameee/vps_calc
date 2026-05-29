import { useState } from 'react';
import type { VPSInputs, CalculatorResult } from '@/types/calculator';
import type { TradePostData } from '@/types/trade';
import { generateTradePost, downloadMarkdown, copyToClipboard } from '@/utils/export';
import { useClipboard } from '@/hooks/useClipboard';
import { Copy, Download, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradePostPanelProps {
  inputs: VPSInputs;
  result: CalculatorResult | null;
}

/**
 * 交易帖生成面板
 *
 * 根据计算结果自动生成并预览交易帖内容，
 * 支持复制到剪贴板和下载 Markdown 文件。
 */
export function TradePostPanel({ inputs, result }: TradePostPanelProps) {
  const [format, setFormat] = useState<'markdown' | 'plain'>('markdown');
  const { copied, copy, reset } = useClipboard();

  if (!result) {
    return (
      <div className={cn('glass-card flex items-center justify-center p-12')}>
        <p className="text-white/50">计算完成后可生成交易帖</p>
      </div>
    );
  }

  const postData: TradePostData = {
    vpsInfo: inputs,
    billingInfo: inputs,
    tradeSettings: inputs,
    result,
    targetCurrency: inputs.tradeCurrency,
  };

  const content = generateTradePost(postData, format);

  const handleCopy = async () => {
    reset();
    await copy(content);
  };

  const handleDownload = () => {
    downloadMarkdown(content, `VPS交易帖_${inputs.provider || '未知'}.md`);
  };

  return (
    <div className={cn('glass-card space-y-5 p-6')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl font-semibold text-white/95">交易帖</h2>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          <button
            onClick={() => setFormat('markdown')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              format === 'markdown' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80',
            )}
          >
            Markdown
          </button>
          <button
            onClick={() => setFormat('plain')}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              format === 'plain' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80',
            )}
          >
            纯文本
          </button>
        </div>
      </div>

      <pre className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-white/80">
        {content}
      </pre>

      <div className="flex items-center gap-3">
        <button
          onClick={handleCopy}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5',
            'bg-white/10 text-sm font-medium text-white/95 transition-all hover:bg-white/20',
            copied && 'bg-green-500/20 text-green-400',
          )}
        >
          {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? '已复制' : '复制内容'}
        </button>
        <button
          onClick={handleDownload}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5',
            'bg-white/10 text-sm font-medium text-white/95 transition-all hover:bg-white/20',
          )}
        >
          <Download className="h-4 w-4" />
          下载文件
        </button>
      </div>
    </div>
  );
}
