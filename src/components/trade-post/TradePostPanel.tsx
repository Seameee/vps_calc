import { useState } from 'react';
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

/* ------------------------------------------------------------------ */
/*  Currency name mapping                                            */
/* ------------------------------------------------------------------ */

const CURRENCY_NAMES: Record<string, string> = {
  USD: '美元',
  CNY: '人民币',
  EUR: '欧元',
  GBP: '英镑',
  JPY: '日元',
};

/* ------------------------------------------------------------------ */
/*  Canvas helpers                                                    */
/* ------------------------------------------------------------------ */

function drawTag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  bgColor: string
) {
  ctx.font = '600 12px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  const width = ctx.measureText(text).width + 16;
  const height = 22;

  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y - height + 4, width, height);

  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 8, y - height / 2 + 4);
  ctx.textBaseline = 'alphabetic';

  return width;
}

/* ------------------------------------------------------------------ */
/*  Draw server icon (decorative)                                     */
/* ------------------------------------------------------------------ */

function drawServerIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Server body (rect)
  ctx.strokeRect(0, 0, size, size * 0.75);

  // Horizontal lines inside
  ctx.beginPath();
  ctx.moveTo(size * 0.15, size * 0.3);
  ctx.lineTo(size * 0.85, size * 0.3);
  ctx.moveTo(size * 0.15, size * 0.5);
  ctx.lineTo(size * 0.85, size * 0.5);
  ctx.stroke();

  // Dots
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(size * 0.25, size * 0.15, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.15, size * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Main render function                                              */
/* ------------------------------------------------------------------ */

const renderToCanvas = async (
  inputs: VPSInputs,
  result: CalculatorResult
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const CARD_W = 640;
  const PADDING = 32;
  const SCALE = 2;
  const symbol = CURRENCY_SYMBOLS[inputs.billingCurrency];
  const tradeSymbol = CURRENCY_SYMBOLS[inputs.tradeCurrency];
  const tradeName = CURRENCY_NAMES[inputs.tradeCurrency] || inputs.tradeCurrency;

  /* ---- helpers ---- */
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const fmtPrice = (n: number) =>
    n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtDays = (n: number) =>
    n.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  /* ---- layout metrics ---- */
  const SECTION_GAP = 20;
  const ITEM_GAP = 12;
  const LABEL_W = 100;
  const VALUE_X = LABEL_W + 16;

  let currentY = PADDING + 60 + 24; // header + separator

  // Calculate section heights
  const tradeMethodLabels: Record<string, string> = {
    original_email: '原始邮箱',
    push: '站内 Push',
    account_password: '账号密码/子账户',
    root_account: 'Root 账号',
  };

  const trafficCalcLabels: Record<string, string> = {
    sum: '总和',
    max: '取最大',
    min: '取最小',
    upload: '仅上传',
    download: '仅下载',
  };

  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: '配置信息',
      rows: [
        ['提供商', inputs.provider || '-'],
        ['型号', inputs.model || '-'],
        ['CPU / 内存', `${inputs.cpu}核 / ${inputs.ram.value}${inputs.ram.unit}`],
        ['存储', `${inputs.storage.value}GB ${inputs.storage.type}`],
        ['带宽', `${inputs.bandwidth.value}${inputs.bandwidth.unit}`],
        ['流量', `${inputs.traffic.unlimited ? '不限' : inputs.traffic.value + inputs.traffic.unit}`],
        ['流量计算', trafficCalcLabels[inputs.trafficCalc] || inputs.trafficCalc],
      ],
    },
    {
      title: '计费信息',
      rows: [
        ['续费价格', `${symbol}${fmtPrice(inputs.renewalPrice)} / ${inputs.billingCycle === 'monthly' ? '月' : inputs.billingCycle === 'quarterly' ? '季' : inputs.billingCycle === 'semi-annually' ? '半年' : inputs.billingCycle === 'annually' ? '年' : inputs.billingCycle === 'biennially' ? '两年' : '三年'}`],
        ['到期时间', fmtDate(inputs.expirationDate)],
        ['剩余天数', `${fmtDays(result.remainingDays)}天`],
      ],
    },
    {
      title: '计算结果',
      rows: [
        ['日均成本', `${symbol}${fmtPrice(result.dailyPrice)}`],
        ['剩余价值', `${symbol}${fmtPrice(result.remainingValue)}`],
        ['换算后', `${tradeSymbol}${fmtPrice(result.convertedValue)}`],
      ],
    },
    {
      title: '交易信息',
      rows: [
        ['交易货币', `${tradeSymbol} ${tradeName}`],
        ...(inputs.tradeMethod ? [['交易方式', tradeMethodLabels[inputs.tradeMethod] || inputs.tradeMethod] as [string, string]] : []),
        ['溢价/折价', `${result.calculatedSurcharge >= 0 ? '+' : ''}${tradeSymbol}${fmtPrice(result.calculatedSurcharge)}`],
        ['过户费', `${tradeSymbol}${fmtPrice(inputs.pushFee)} (${inputs.feeBearer === 'seller' ? '卖家承担' : '买家承担'})`],
      ],
    },
  ];

  // Calculate total height
  let totalHeight = currentY;
  for (const section of sections) {
    totalHeight += 28 + 12; // title + margin
    totalHeight += section.rows.length * (14 * 1.6 + ITEM_GAP);
    totalHeight += SECTION_GAP;
  }
  totalHeight += 100; // final value + tags + footer

  /* ---- canvas setup ---- */
  canvas.width = CARD_W * SCALE;
  canvas.height = totalHeight * SCALE;
  ctx.scale(SCALE, SCALE);

  /* ---- card background ---- */
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, CARD_W, totalHeight);

  /* ---- subtle border ---- */
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, CARD_W, totalHeight);

  /* ---- top accent line ---- */
  const grad = ctx.createLinearGradient(PADDING, 0, CARD_W - PADDING, 0);
  grad.addColorStop(0, '#60a5fa');
  grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad;
  ctx.fillRect(PADDING, 12, CARD_W - PADDING * 2, 3);

  /* ---- header: icon + title ---- */
  drawServerIcon(ctx, PADDING, PADDING + 4, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 22px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('VPS 交易帖', PADDING + 48, PADDING + 30);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(inputs.provider || '未知提供商', PADDING + 48, PADDING + 52);

  /* ---- separator ---- */
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, currentY - 12);
  ctx.lineTo(CARD_W - PADDING, currentY - 12);
  ctx.stroke();

  /* ---- sections ---- */
  for (const section of sections) {
    // Section title with left accent
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(PADDING, currentY, 3, 18);

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 15px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(section.title, PADDING + 10, currentY + 14);
    currentY += 28;

    // Section background
    const sectionH = section.rows.length * (14 * 1.6 + ITEM_GAP) - ITEM_GAP + 16;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(PADDING, currentY - 4, CARD_W - PADDING * 2, sectionH);

    // Rows
    for (const [label, value] of section.rows) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '13px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(label, PADDING + 12, currentY + 14);

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '500 13px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(value, PADDING + 12 + LABEL_W, currentY + 14);

      currentY += 14 * 1.6 + ITEM_GAP;
    }

    currentY += SECTION_GAP - ITEM_GAP;
  }

  /* ---- final value highlight ---- */
  const finalY = currentY;
  ctx.fillStyle = 'rgba(96, 165, 250, 0.1)';
  ctx.fillRect(PADDING, finalY, CARD_W - PADDING * 2, 56);

  ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PADDING, finalY, CARD_W - PADDING * 2, 56);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '13px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('最终价值', PADDING + 16, finalY + 28);

  ctx.fillStyle = '#60a5fa';
  ctx.font = '600 24px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  const finalText = `${tradeSymbol}${fmtPrice(result.finalValue)}`;
  const finalW = ctx.measureText(finalText).width;
  ctx.fillText(finalText, CARD_W - PADDING - 16 - finalW, finalY + 32);

  currentY = finalY + 56 + 24;

  /* ---- tags ---- */
  let tagX = PADDING;
  const tags = [
    { text: `剩 ${fmtDays(result.remainingDays)} 天`, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    { text: `日均 ${tradeSymbol}${fmtPrice(result.dailyPrice)}`, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
    { text: `溢价 ${result.calculatedSurcharge >= 0 ? '+' : ''}${tradeSymbol}${fmtPrice(result.calculatedSurcharge)}`, color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  ];

  for (const tag of tags) {
    const tw = drawTag(ctx, tag.text, tagX, currentY, tag.color, tag.bg);
    tagX += tw + 8;
  }

  currentY += 32;

  /* ---- watermark ---- */
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('VPS Value Calculator', PADDING, currentY + 16);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '10px Inter, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`https://vpscalc.seaya.link`, PADDING, currentY + 34);
  ctx.fillText(`生成于 ${new Date().toLocaleDateString('zh-CN')}`, PADDING, currentY + 50);

  return canvas;
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

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
      const canvas = await renderToCanvas(inputs, result);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `VPS\u4ea4\u6613\u5e16_${inputs.provider || '\u672a\u77e3'}.png`;
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
      const canvas = await renderToCanvas(inputs, result);
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
        <div className="format-toggle-group flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          <button
            onClick={() => setFormat('markdown')}
            className={cn(
              'format-toggle-btn rounded-md px-3 py-1 text-xs font-medium transition-colors',
              format === 'markdown' ? 'format-toggle-active bg-white/10 text-white' : 'text-white/50 hover:text-white/80',
            )}
          >
            Markdown
          </button>
          <button
            onClick={() => setFormat('plain')}
            className={cn(
              'format-toggle-btn rounded-md px-3 py-1 text-xs font-medium transition-colors',
              format === 'plain' ? 'format-toggle-active bg-white/10 text-white' : 'text-white/50 hover:text-white/80',
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
