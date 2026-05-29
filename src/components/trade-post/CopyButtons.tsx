import { useCallback } from 'react';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '@/hooks/useClipboard';
import { cn } from '@/lib/utils';

interface CopyButtonsProps {
  text: string;
  markdownText: string;
  onCopy: (text: string) => void;
}

export function CopyButtons({ text, markdownText, onCopy }: CopyButtonsProps) {
  const { copied: plainCopied, copy: copyPlain } = useClipboard();
  const { copied: mdCopied, copy: copyMd } = useClipboard();

  const handleCopyPlain = useCallback(async () => {
    await copyPlain(text);
    onCopy(text);
  }, [copyPlain, text, onCopy]);

  const handleCopyMarkdown = useCallback(async () => {
    await copyMd(markdownText);
    onCopy(markdownText);
  }, [copyMd, markdownText, onCopy]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleCopyPlain}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
          'bg-white/5 border border-white/10 hover:bg-white/10 text-white/90'
        )}
      >
        {plainCopied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-white/70" />
        )}
        复制纯文本
      </button>
      <button
        type="button"
        onClick={handleCopyMarkdown}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
          'bg-white/5 border border-white/10 hover:bg-white/10 text-white/90'
        )}
      >
        {mdCopied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-white/70" />
        )}
        复制 Markdown
      </button>
    </div>
  );
}
