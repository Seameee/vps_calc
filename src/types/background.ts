/** 背景图状态 */
export type BackgroundStatus = 'loading' | 'loaded' | 'error';

/** 背景图 Hook 返回值 */
export interface UseBackgroundImageReturn {
  status: BackgroundStatus;
  imageUrl: string | null;
  retry: () => void;
}
