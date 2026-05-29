import { useBackgroundImage } from '@/hooks/useBackgroundImage';

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';

/**
 * 背景组件
 *
 * 从 API 加载每日背景图，失败时使用 CSS 渐变降级，
 * 叠加暗色遮罩确保文字可读性。
 */
export function Background() {
  const { status, imageUrl } = useBackgroundImage();

  const isLoaded = status === 'loaded' && imageUrl !== null;

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={
          isLoaded
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : { background: FALLBACK_GRADIENT }
        }
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50" />
    </div>
  );
}
