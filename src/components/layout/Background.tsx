import { useBackgroundImage } from '@/hooks/useBackgroundImage';

/**
 * 背景组件
 *
 * 从 API 加载每日背景图，失败时使用 CSS 渐变降级，
 * 叠加遮罩确保文字可读性。遮罩颜色跟随主题切换。
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
        style={{ background: 'var(--fallback-gradient)' }}
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
      
      {/* 主题感知遮罩 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, var(--overlay-from), var(--overlay-to))',
        }}
      />
    </div>
  );
}
