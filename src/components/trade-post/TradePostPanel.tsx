import { useState, useRef } from 'react';
import type { VPSInputs, CalculatorResult } from '@/types/calculator';
import type { TradePostData } from '@/types/trade';
import { generateTradePost, generateTradePostTitle, downloadMarkdown } from '@/utils/export';
import { useClipboard } from '@/hooks/useClipboard';
import { CURRENCY_SYMBOLS } from '@/utils/constants';
import { Copy, Download, FileText, CheckCircle2, Type, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradePostPanelProps {
  inputs: VPSInputs;
  result: CalculatorResult | null;
}

export function TradePostPanel({ inputs, result }: TradePostPanelProps) {
  const [format, setFormat] = useState<'markdown' | 'plain'>('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const renderRef = useRef<HTMLDivElement>(null);

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
    downloadMarkdown(content, `VPS\u4ea4\u6613\u5e16_${inputs.provider || '\u672a\u77e5'}.md`);
  };

  const renderToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(element, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      logging: false,
    });
  };

  const handleExportImage = async () => {
    if (!renderRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await renderToCanvas(renderRef.current);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VPS\u4ea4\u6613\u5e16_${inputs.provider || '\u672a\u77e5'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出图片失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!renderRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await renderToCanvas(renderRef.current);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      }
    } catch (error) {
      console.error('复制图片失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const symbol = CURRENCY_SYMBOLS[inputs.tradeCurrency];

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
            <p className="text-xs text-white/50 mb-1">标题预览</p>
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

      {/* 源码预览 */}
      <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-sm leading-relaxed text-white/80">
        {content}
      </pre>

      {/* 隐藏的渲染区域 — 用于导出图片时渲染样式化内容 */}
      <div
        ref={renderRef}
        className="fixed -left-[9999px] top-0 w-[600px] p-6 rounded-2xl"
        style={{ background: '#0f172a', fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
      >
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: 0 }}>{title}</h2>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {content.split('\n').map((line, i) => {
            if (line.startsWith('##') || line.startsWith('【')) {
              return <div key={i} style={{ color: '#60a5fa', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>{line.replace(/^##+\s*/, '')}</div>;
            }
            if (line.startsWith('**')) {
              return <div key={i} style={{ fontWeight: 600 }}>{line.replace(/\*\*/g, '')}</div>;
            }
            return <div key={i}>{line}</div>;
          })}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '16px', paddingTop: '12px', textAlign: 'right' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
            生成于 {new Date().toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

      {/* 导出图片 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportImage}
          disabled={isExporting}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2',
            'bg-white/10 text-sm font-medium text-white/95 transition-all hover:bg-white/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <Image className="h-4 w-4" />
          {isExporting ? '生成中...' : '导出图片'}
        </button>
        <button
          onClick={handleCopyImage}
          disabled={isExporting}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2',
            'bg-white/10 text-sm font-medium text-white/95 transition-all hover:bg-white/20',
            copiedImage && 'bg-green-500/20 text-green-400',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {copiedImage ? <CheckCircle2 className="h-4 w-4" /> : <Image className="h-4 w-4" />}
          {isExporting ? '生成中...' : copiedImage ? '已复制' : '复制图片'}
        </button>
      </div>
    </div>
  );
}
