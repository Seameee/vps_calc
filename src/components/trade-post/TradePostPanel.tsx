import { useState } from 'react';
import type { VPSInputs, CalculatorResult } from '@/types/calculator';
import type { TradePostData } from '@/types/trade';
import { generateTradePost, generateTradePostTitle, downloadMarkdown } from '@/utils/export';
import { useClipboard } from '@/hooks/useClipboard';
import { Copy, Download, FileText, CheckCircle2, Type, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradePostPanelProps {
  inputs: VPSInputs;
  result: CalculatorResult | null;
}

/**
 * 将文本按 maxWidth 自动换行
 * 支持中英文混合，按字符逐个检查宽度
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  if (!text) return [''];

  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
};

/**
 * 使用原生 Canvas API 绘制交易帖图片
 * 完全绕过 html2canvas，避免 iframe/CSP 兼容性问题
 */
const renderToCanvas = async (
  title: string,
  content: string
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const WIDTH = 600;
  const PADDING = 24;
  const CONTENT_WIDTH = WIDTH - PADDING * 2;
  const BASE_LINE_HEIGHT = Math.round(14 * 1.8); // ~25px
  const SCALE = 2;

  // ---- 1. 预计算内容高度 ----
  let contentHeight = 0;
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('##') || line.startsWith('【')) {
      ctx.font = '600 14px Inter, "Noto Sans SC", sans-serif';
      const text = line.replace(/^##+\s*/, '');
      const wrapped = wrapText(ctx, text, CONTENT_WIDTH);
      contentHeight += wrapped.length * BASE_LINE_HEIGHT + 12 + 8;
    } else if (line.startsWith('**')) {
      ctx.font = '600 14px Inter, "Noto Sans SC", sans-serif';
      const text = line.replace(/\*\*/g, '');
      const wrapped = wrapText(ctx, text, CONTENT_WIDTH);
      contentHeight += wrapped.length * BASE_LINE_HEIGHT;
    } else if (line.trim() === '') {
      contentHeight += BASE_LINE_HEIGHT;
    } else {
      ctx.font = '14px Inter, "Noto Sans SC", sans-serif';
      const wrapped = wrapText(ctx, line, CONTENT_WIDTH);
      contentHeight += wrapped.length * BASE_LINE_HEIGHT;
    }
  }

  // 标题区域高度
  const HEADER_HEIGHT = 18 + 12 + 16; // fontSize + padding + margin
  const FOOTER_HEIGHT = 16 + 12 + 12 + 12; // border + padding + fontSize + extra
  const TOTAL_HEIGHT = PADDING + HEADER_HEIGHT + contentHeight + FOOTER_HEIGHT + PADDING;

  // ---- 2. 设置 Canvas 尺寸 (Retina) ----
  canvas.width = WIDTH * SCALE;
  canvas.height = TOTAL_HEIGHT * SCALE;
  ctx.scale(SCALE, SCALE);

  // ---- 3. 绘制背景 ----
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, WIDTH, TOTAL_HEIGHT);

  // ---- 4. 绘制标题 ----
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px Inter, "Noto Sans SC", sans-serif';
  const titleY = PADDING + 18;
  ctx.fillText(title, PADDING, titleY);

  // 标题下边框
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, titleY + 12);
  ctx.lineTo(WIDTH - PADDING, titleY + 12);
  ctx.stroke();

  // ---- 5. 绘制内容 ----
  let y = PADDING + HEADER_HEIGHT;

  for (const line of lines) {
    if (line.startsWith('##') || line.startsWith('【')) {
      // 小标题行
      ctx.fillStyle = '#60a5fa';
      ctx.font = '600 14px Inter, "Noto Sans SC", sans-serif';
      const text = line.replace(/^##+\s*/, '');
      const wrapped = wrapText(ctx, text, CONTENT_WIDTH);
      for (const l of wrapped) {
        ctx.fillText(l, PADDING, y);
        y += BASE_LINE_HEIGHT;
      }
      y += 12 + 8 - BASE_LINE_HEIGHT; // marginTop + marginBottom 调整
    } else if (line.startsWith('**')) {
      // 粗体行
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 14px Inter, "Noto Sans SC", sans-serif';
      const text = line.replace(/\*\*/g, '');
      const wrapped = wrapText(ctx, text, CONTENT_WIDTH);
      for (const l of wrapped) {
        ctx.fillText(l, PADDING, y);
        y += BASE_LINE_HEIGHT;
      }
    } else if (line.trim() === '') {
      // 空行
      y += BASE_LINE_HEIGHT;
    } else {
      // 普通行
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '14px Inter, "Noto Sans SC", sans-serif';
      const wrapped = wrapText(ctx, line, CONTENT_WIDTH);
      for (const l of wrapped) {
        ctx.fillText(l, PADDING, y);
        y += BASE_LINE_HEIGHT;
      }
    }
  }

  // ---- 6. 绘制底部 ----
  y += 16;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  y += 12 + 12;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '12px Inter, "Noto Sans SC", sans-serif';
  const dateText = `生成于 ${new Date().toLocaleDateString('zh-CN')}`;
  const dateWidth = ctx.measureText(dateText).width;
  ctx.fillText(dateText, WIDTH - PADDING - dateWidth, y);

  return canvas;
};

export function TradePostPanel({ inputs, result }: TradePostPanelProps) {
  const [format, setFormat] = useState<'markdown' | 'plain'>('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

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

  const handleExportImage = async () => {
    setIsExporting(true);
    try {
      const canvas = await renderToCanvas(title, content);
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
    setIsExporting(true);
    try {
      const canvas = await renderToCanvas(title, content);
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
