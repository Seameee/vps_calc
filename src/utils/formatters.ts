/**
 * 格式化货币金额
 */
export function formatCurrency(amount: number, _currency: string): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
