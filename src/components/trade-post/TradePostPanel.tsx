import { useState } from 'react';
import type { VPSInputs, CalculatorResult } from '@/types/calculator';
import type { TradePostData } from '@/types/trade';
import { generateTradePost, generateTradePostTitle, downloadMarkdown } from '@/utils/export';
import { useClipboard } from '@/hooks/useClipboard';
import { Copy, Download, FileText, CheckCircle2, Type } from 'lucide-react';
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
  const { copied: contentCopied, copy: copyContent, reset: resetContent } = useClipboard();
  const { copied: titleCopied, copy: copyTitle, reset: resetTitle } = useClipboard();

  if (!result) {
    return (
      <div className={cn('glass-card flex items-center justify-center p-8')}>
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
  const title = generateTradePostTitle(postData);

  const handleCopy = async () => {
    resetContent();
    await copyContent(content);
  };

  const handleCopyTitle = async () => {
    resetTitle();
    await copyTitle(title);
  };

  const handleDownload = () => {
    downloadMarkdown(content, `VPS交易帖_${inputs.provider || '未知'}.md`);
  };

  return (
    <div className={cn('glass-card space-y-4 p-4')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white/95">交易帖</h2>
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

      {/* 标题预览 + 复制 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-white/50 mb-1">标题</p>
            <p className="text-sm text-white/90 truncate">{title}</p>
          </div>
          <button
            onClick={handleCopyTitle}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5',
              'bg-white/10 text-xs font-medium text-white/95 transition-all hover:bg-white/20',
              titleCopied && 'bg-green-500/20 text-green-400 border-green-500/30'
            )}
          >
            {titleCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Type className="h-3.5 w-3.5" />}
            {titleCopied ? '已复制' : '复制标题'}
          </button>
        </div>
      </div>

      <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed text-white/80">
        {content}
      </pre>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2',
            'bg-white/10 text-sm font-medium text-white/95 transition-all hover:bg-white/20',
            contentCopied && 'bg-green-500/20 text-green-400',
          )}
        >
          {contentCopied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {contentCopied ? '已复制' : '复制内容'}
        </button>
        <button
          onClick={handleDownload}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2',
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
