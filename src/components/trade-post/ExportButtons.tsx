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

const exportOptions = [
  { value: 'png' as const, label: 'PNG 格式' },
  { value: 'jpeg' as const, label: 'JPEG 格式' },
];

/**
 * 导出按钮组
 *
 * 可访问性支持：
 * - 键盘导航：ArrowUp/ArrowDown 切换选项，Enter 选择，Escape 关闭
 * - ARIA：aria-expanded + aria-haspopup="menu"
 * - Focus 管理：关闭时 focus 返回 trigger
 */
export function ExportButtons({ contentRef, data }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
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

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const openDropdown = useCallback(() => {
    setDropdownOpen(true);
    setActiveIndex(0);
  }, []);

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
      closeDropdown();
    }
  }, [contentRef, data, closeDropdown]);

  // 键盘导航
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!dropdownOpen) {
          openDropdown();
        } else {
          if (activeIndex >= 0 && activeIndex < exportOptions.length) {
            handleExportImage(exportOptions[activeIndex].value);
          }
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!dropdownOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) => (prev < exportOptions.length - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!dropdownOpen) {
          openDropdown();
        } else {
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : exportOptions.length - 1));
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (dropdownOpen) {
          closeDropdown();
        }
        break;
      case 'Home':
        if (dropdownOpen) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (dropdownOpen) {
          e.preventDefault();
          setActiveIndex(exportOptions.length - 1);
        }
        break;
    }
  };

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
          ref={triggerRef}
          type="button"
          onClick={() => dropdownOpen ? closeDropdown() : openDropdown()}
          onKeyDown={handleTriggerKeyDown}
          disabled={isExporting}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
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
          <div
            className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-xl overflow-hidden z-50"
            role="menu"
          >
            {exportOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                onClick={() => handleExportImage(option.value)}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-white/90 hover:bg-white/10 transition-colors text-left',
                  index === activeIndex && 'bg-white/10'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
