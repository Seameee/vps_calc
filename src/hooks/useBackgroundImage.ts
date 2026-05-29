import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseBackgroundImageReturn } from '@/types/background';
import { BG_API_URL, BG_TIMEOUT_MS } from '@/utils/constants';

/**
 * 背景图加载 Hook
 *
 * - 组件挂载时自动加载背景图
 * - 加载成功/失败均更新状态
 * - 支持手动重试
 * - 自动清理：组件卸载时取消挂起的加载
 */
export function useBackgroundImage(): UseBackgroundImageReturn {
  const [status, setStatus] = useState<import('@/types/background').BackgroundStatus>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadImage = useCallback(() => {
    setStatus('loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus('error');
      setImageUrl(null);
    }, BG_TIMEOUT_MS);

    img.onload = () => {
      if (!mountedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('loaded');
      setImageUrl(BG_API_URL);
    };

    img.onerror = () => {
      if (!mountedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('error');
      setImageUrl(null);
    };

    img.src = BG_API_URL;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadImage();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadImage]);

  return { status, imageUrl, retry: loadImage };
}
