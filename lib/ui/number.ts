/**
 * 统一的数值格式。
 *
 * 服务端组件和客户端组件必须走同一个实现：否则同一个数字会在页头写成 `13543`、
 * 在面板里写成 `13,543`。这种不一致比数字本身更伤观感，而且极难被测试发现。
 *
 * Intl.NumberFormat 的构造有可观开销，所以按「语言 + 小数位」缓存实例。
 */
const cache = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, decimals: number) {
  const key = `${locale}|${decimals}`;
  let instance = cache.get(key);
  if (!instance) {
    instance = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    cache.set(key, instance);
  }
  return instance;
}

export function formatNumber(value: number, options: { locale?: string; decimals?: number } = {}) {
  const { locale = "en-US", decimals = 0 } = options;
  return formatter(locale, decimals).format(value);
}

/**
 * 时限显示。
 *
 * 评测机的时限以毫秒报价，但「1000 ms」是机器单位，人读起来要换算一次。
 * 满一秒之后改用秒 + 一位小数（1.0 s / 2.5 s），不足一秒仍给毫秒——
 * 后者在竞赛题里是真实存在的，不能被四舍五入成 0.0 s。
 */
export function formatDuration(valueMs: number, locale = "en-US") {
  if (valueMs < 1000) return `${formatNumber(valueMs, { locale })} ms`;
  return `${formatNumber(valueMs / 1000, { locale, decimals: 1 })} s`;
}

/** 内存显示：KB 是接口单位，MB 是读者单位。 */
export function formatMemory(memoryKb: number, locale = "en-US") {
  if (memoryKb < 1024) return `${formatNumber(memoryKb, { locale })} KB`;
  return `${formatNumber(memoryKb / 1024, { locale })} MB`;
}
