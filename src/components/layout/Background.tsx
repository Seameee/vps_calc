import { useBackgroundImage } from '@/hooks/useBackgroundImage';

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';

/**
 * 背景组件
 *
 * 从 API 加载每日背景图，失败时使用 CSS 渐变降级，
 * 叠加暗色遮罩确保文字可读性。
 * 
 * 使用双层背景避免加载过程中的闪烁：
 * - 底层：始终显示的 fallback 渐变
 * - 上层：加载成功后淡入的背景图片
 */
export function Background() {
  const { status, imageUrl } = useBackgroundImage();

  const isLoaded = status === 'loaded' && imageUrl !== null;

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      {/* 底层 fallback：始终显示，避免加载空白 */}
      <div
        className="absolute inset-0"
        style={{ background: FALLBACK_GRADIENT }}
      />
      
      {/* 上层背景图：加载成功后淡入 */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{
          backgroundImage: isLoaded ? `url(${imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: isLoaded ? 1 : 0,
        }}
      />
      
      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
    </div>
  );
}
