import type { TradePostData, TradePostFormat } from '@/types/trade';
import { CURRENCY_SYMBOLS } from './constants';
import { formatDate } from './date';

/**
 * 生成交易帖标题（统一格式）
 * [出售] Provider - Model - ¥Price
 */
export function generateTradePostTitle(data: TradePostData): string {
  const { vpsInfo, result, targetCurrency } = data;
  const symbol = CURRENCY_SYMBOLS[targetCurrency];
  const provider = vpsInfo.provider || 'VPS';
  const model = vpsInfo.model || '';
  const price = result.finalValue.toFixed(2);

  const parts: string[] = ['[出售]', provider];
  if (model) parts.push(model);
  parts.push(`${symbol}${price}`);

  return parts.join(' - ');
}

/**
 * 生成交易帖内容
 */
export function generateTradePost(data: TradePostData, format: TradePostFormat): string {
  const { vpsInfo, billingInfo, tradeSettings, result, targetCurrency } = data;
  const symbol = CURRENCY_SYMBOLS[targetCurrency];

  const lines: string[] = [];

  // 统一标题格式：都包含价格
  const title = generateTradePostTitle(data);

  if (format === 'markdown') {
    lines.push(`## ${title}`);
    lines.push('');
    lines.push('### 配置信息');
  } else {
    lines.push(title);
    lines.push('');
    lines.push('【配置信息】');
  }

  const specs: string[] = [];
  if (vpsInfo.cpu) specs.push(`CPU: ${vpsInfo.cpu}核`);
  if (vpsInfo.ram.value) specs.push(`内存: ${vpsInfo.ram.value}${vpsInfo.ram.unit}`);
  if (vpsInfo.storage.value) specs.push(`硬盘: ${vpsInfo.storage.value}GB ${vpsInfo.storage.type}`);
  if (vpsInfo.bandwidth.value) specs.push(`带宽: ${vpsInfo.bandwidth.value}${vpsInfo.bandwidth.unit}`);
  if (vpsInfo.traffic.unlimited) {
    specs.push('流量: 不限');
  } else if (vpsInfo.traffic.value) {
    specs.push(`流量: ${vpsInfo.traffic.value}${vpsInfo.traffic.unit}/月`);
  }

  if (specs.length > 0) {
    lines.push(specs.join(' | '));
  }

  // 流量计算方式
  const trafficCalcLabels: Record<string, string> = {
    sum: '总和',
    max: '取最大',
    min: '取最小',
    upload: '仅上传',
    download: '仅下载',
  };
  lines.push(`流量计算: ${trafficCalcLabels[vpsInfo.trafficCalc] || vpsInfo.trafficCalc}`);

  if (vpsInfo.features.length > 0) {
    lines.push(`特性: ${vpsInfo.features.join(', ')}`);
  }

  if (vpsInfo.notes) {
    lines.push(`备注: ${vpsInfo.notes}`);
  }

  lines.push('');

  if (format === 'markdown') {
    lines.push(`### 计费信息`);
  } else {
    lines.push('【计费信息】');
  }

  lines.push(`到期时间: ${formatDate(billingInfo.expirationDate)}`);
  lines.push(`剩余天数: ${Math.ceil(result.remainingDays)}天`);
  lines.push(`续费价格: ${CURRENCY_SYMBOLS[billingInfo.billingCurrency]}${billingInfo.renewalPrice.toFixed(2)}/${getBillingCycleLabel(billingInfo.billingCycle)}`);

  lines.push('');

  if (format === 'markdown') {
    lines.push(`### 交易信息`);
  } else {
    lines.push('【交易信息】');
  }

  lines.push(`售价: ${symbol}${result.finalValue.toFixed(2)} ${targetCurrency}`);

  // 交易方式
  const tradeMethodLabels: Record<string, string> = {
    original_email: '原始邮箱',
    push: '站内 Push',
    account_password: '账号密码/子账户',
    root_account: 'Root 账号',
  };
  if (tradeSettings.tradeMethod) {
    lines.push(`交易方式: ${tradeMethodLabels[tradeSettings.tradeMethod] || tradeSettings.tradeMethod}`);
  }

  if (result.calculatedSurcharge !== 0) {
    const sign = result.calculatedSurcharge > 0 ? '+' : '-';
    lines.push(`溢价/折价: ${sign}${symbol}${Math.abs(result.calculatedSurcharge).toFixed(2)}`);
  }

  if (tradeSettings.pushFee > 0) {
    lines.push(`PUSH费用: ${symbol}${tradeSettings.pushFee.toFixed(2)} (${tradeSettings.feeBearer === 'seller' ? '卖家承担' : '买家承担'})`);
  }

  return lines.join('\n');
}

function getBillingCycleLabel(cycle: import('@/types/calculator').BillingCycle): string {
  const labels: Record<string, string> = {
    monthly: '月',
    quarterly: '季',
    'semi-annually': '半年',
    annually: '年',
    biennially: '两年',
    triennially: '三年',
  };
  return labels[cycle] || cycle;
}

/**
 * 下载 Markdown 文件
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<void> {
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
}

/**
 * 导出图片（下载）
 */
export function downloadImage(dataUrl: string, filename: string = 'VPS-交易信息.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 复制图片到剪贴板
 */
export async function copyImageToClipboard(dataUrl: string): Promise<void> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    } else {
      throw new Error('浏览器不支持复制图片到剪贴板');
    }
  } catch (error) {
    throw new Error('复制图片失败: ' + (error instanceof Error ? error.message : String(error)));
  }
}
