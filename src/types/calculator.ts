/** 计费周期 */
export type BillingCycle = 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'biennially' | 'triennially';

/** 交易方式 */
export type TradeMethod = 'original_email' | 'push' | 'account_password' | 'root_account';

/** 费用承担方 */
export type FeeBearer = 'seller' | 'buyer';

/** VPS 基本信息 */
export interface VPSInfo {
  provider: string;
  model: string;
  cpu: number | null;
  ram: { value: number; unit: 'GB' | 'MB' };
  storage: { value: number; type: 'SSD' | 'HDD' | 'NVMe' };
  bandwidth: { value: number; unit: 'Mbps' | 'Gbps' };
  traffic: { value: number; unit: 'GB' | 'TB'; unlimited: boolean };
  trafficCalc: 'sum' | 'max' | 'min' | 'upload' | 'download';
  features: string[];
  notes: string;
}

/** 计费信息 */
export interface BillingInfo {
  renewalPrice: number;
  billingCurrency: import('./currency').CurrencyCode;
  billingCycle: BillingCycle;
  expirationDate: Date;
}

/** 交易设置 */
export interface TradeSettings {
  surcharge: number;
  targetFinalPrice: number | null;
  tradeMethod: TradeMethod | null;
  pushFee: number;
  feeBearer: FeeBearer;
  tradeCurrency: import('./currency').CurrencyCode;
  isRoundingEnabled: boolean;
}

/** 账户余额 */
export interface AccountBalance {
  accountBalance: number;
  affBalance: number;
  balanceCurrency: import('./currency').CurrencyCode;
}

/** 完整 VPS 输入 */
export interface VPSInputs extends VPSInfo, BillingInfo, TradeSettings, AccountBalance {}

/** 计算结果 */
export interface CalculatorResult {
  remainingDays: number;
  dailyPrice: number;
  remainingValue: number;
  convertedValue: number;
  calculatedSurcharge: number;
  finalValue: number;
  formula: string;
  exchangeRate: number | null;
}
