import { useState, useCallback } from 'react';

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * 剪贴板操作 Hook
 *
 * 提供复制文本到剪贴板的功能，带成功状态反馈
 */
export function useClipboard(timeout = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // 降级方案
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      } catch (error) {
        console.error('Copy failed:', error);
        setCopied(false);
      }
    },
    [timeout],
  );

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  return { copied, copy, reset };
}
