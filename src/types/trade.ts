import type { CurrencyCode } from './currency';
import type { CalculatorResult, VPSInfo, BillingInfo, TradeSettings } from './calculator';

/** 交易帖格式 */
export type TradePostFormat = 'markdown' | 'plain';

/** 交易帖数据 */
export interface TradePostData {
  vpsInfo: VPSInfo;
  billingInfo: BillingInfo;
  tradeSettings: TradeSettings;
  result: CalculatorResult;
  targetCurrency: CurrencyCode;
}

/** 导出选项 */
export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality?: number;
  scale?: number;
}
