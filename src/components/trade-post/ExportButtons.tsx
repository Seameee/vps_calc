import { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Image, FileText, ChevronDown } from 'lucide-react';
import { downloadMarkdown, generateTradePost, downloadImage } from '@/utils/export';
import type { TradePostData } from '@/types/trade';
import { cn } from '@/lib/utils';

interface ExportButtonsProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  data: TradePostData;
}

export function ExportButtons({ contentRef, data }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleDownloadMarkdown = useCallback(() => {
    const markdown = generateTradePost(data, 'markdown');
    const filename = `${data.vpsInfo.provider || 'VPS'}_交易帖.md`;
    downloadMarkdown(markdown, filename);
  }, [data]);

  const handleExportImage = useCallback(async (format: 'png' | 'jpeg') => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#0a0a14',
        scale: 2,
      });
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.92);
      const filename = `${data.vpsInfo.provider || 'VPS'}_交易帖.${format}`;
      downloadImage(dataUrl, filename);
    } catch (error) {
      console.error('导出图片失败:', error);
    } finally {
      setIsExporting(false);
      setDropdownOpen(false);
    }
  }, [contentRef, data]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleDownloadMarkdown}
        disabled={isExporting}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
          'bg-gradient-to-r from-blue-400 to-purple-400 text-white',
          'shadow-[0_4px_6px_-1px_rgba(96,165,250,0.3)] hover:shadow-[0_10px_15px_-3px_rgba(96,165,250,0.4)] hover:brightness-110',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <FileText className="h-4 w-4" />
        导出 Markdown
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(prev => !prev)}
          disabled={isExporting}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
            'bg-gradient-to-r from-blue-400 to-purple-400 text-white',
            'shadow-[0_4px_6px_-1px_rgba(96,165,250,0.3)] hover:shadow-[0_10px_15px_-3px_rgba(96,165,250,0.4)] hover:brightness-110',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Image className="h-4 w-4" />
          导出图片
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              dropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
            <button
              type="button"
              onClick={() => handleExportImage('png')}
              className="w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors text-left"
            >
              PNG 格式
            </button>
            <button
              type="button"
              onClick={() => handleExportImage('jpeg')}
              className="w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors text-left"
            >
              JPEG 格式
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
