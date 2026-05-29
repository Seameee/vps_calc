/**
 * 计算两个日期之间的精确天数（包含闰年闰月）
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数差（可为小数，精确到毫秒）
 */
export function getExactDaysBetween(startDate: Date, endDate: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / MS_PER_DAY;
}

/**
 * 获取指定月份的天数
 * @param year - 年份
 * @param month - 月份 (0-11)
 * @returns 该月天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * 判断是否为闰年
 * @param year - 年份
 * @returns 是否为闰年
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 获取指定年份的天数
 * @param year - 年份
 * @returns 365 或 366
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * 获取计费周期天数
 * @param billingCycle - 计费周期
 * @param referenceDate - 参考日期（用于确定当前月份/年份）
 * @returns 周期天数
 */
export function getBillingCycleDays(billingCycle: import('@/types/calculator').BillingCycle, referenceDate: Date): number {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (billingCycle) {
    case 'monthly':
      return getDaysInMonth(year, month);
    case 'quarterly': {
      let days = 0;
      for (let i = 0; i < 3; i++) {
        days += getDaysInMonth(year, month + i);
      }
      return days;
    }
    case 'semi-annually': {
      let days = 0;
      for (let i = 0; i < 6; i++) {
        days += getDaysInMonth(year, month + i);
      }
      return days;
    }
    case 'annually':
      return getDaysInYear(year);
    case 'biennially': {
      const nextYear = year + 1;
      return getDaysInYear(year) + getDaysInYear(nextYear);
    }
    case 'triennially': {
      const y1 = year + 1;
      const y2 = year + 2;
      return getDaysInYear(year) + getDaysInYear(y1) + getDaysInYear(y2);
    }
    default:
      return 30;
  }
}

/**
 * 计算日单价
 * @param price - 周期价格
 * @param billingCycle - 计费周期
 * @param referenceDate - 参考日期
 * @returns 日单价
 */
export function calculateDailyPrice(
  price: number,
  billingCycle: import('@/types/calculator').BillingCycle,
  referenceDate: Date
): number {
  const days = getBillingCycleDays(billingCycle, referenceDate);
  return days > 0 ? price / days : 0;
}

/**
 * 计算剩余价值
 * @param price - 周期价格
 * @param billingCycle - 计费周期
 * @param expirationDate - 到期日期
 * @returns 剩余价值结果
 */
export function calculateRemainingValue(
  price: number,
  billingCycle: import('@/types/calculator').BillingCycle,
  expirationDate: Date
): { dailyPrice: number; remainingDays: number; remainingValue: number } {
  const now = new Date();
  const dailyPrice = calculateDailyPrice(price, billingCycle, now);
  const remainingDays = getExactDaysBetween(now, expirationDate);

  return {
    dailyPrice,
    remainingDays: Math.max(0, remainingDays),
    remainingValue: Math.max(0, dailyPrice * remainingDays),
  };
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param date - 日期
 * @returns 格式化字符串
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
