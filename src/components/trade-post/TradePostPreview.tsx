import { useState, useRef, useMemo } from 'react';
import { generateTradePost } from '@/utils/export';
import type { TradePostData } from '@/types/trade';
import { cn } from '@/lib/utils';
import { FormatToggle } from './FormatToggle';
import { CopyButtons } from './CopyButtons';
import { ExportButtons } from './ExportButtons';

interface TradePostPreviewProps {
  data: TradePostData;
}

export function TradePostPreview({ data }: TradePostPreviewProps) {
  const [format, setFormat] = useState<'markdown' | 'plain'>('markdown');
  const contentRef = useRef<HTMLDivElement>(null);

  const plainText = useMemo(() => generateTradePost(data, 'plain'), [data]);
  const markdownText = useMemo(() => generateTradePost(data, 'markdown'), [data]);

  const displayText = format === 'markdown' ? markdownText : plainText;

  return (
    <div className={cn('glass-card p-6 space-y-6')}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-white/95">交易帖预览</h3>
        <FormatToggle format={format} onChange={setFormat} />
      </div>

      <div ref={contentRef} className="space-y-4">
        <pre className="bg-black/20 rounded-xl p-4 font-mono text-sm text-white/85 whitespace-pre-wrap border border-white/5">
          {displayText}
        </pre>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <CopyButtons
          text={plainText}
          markdownText={markdownText}
          onCopy={() => {}}
        />
        <ExportButtons contentRef={contentRef} data={data} />
      </div>
    </div>
  );
}
