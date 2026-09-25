/**
 * 轮询到终态或截止时间。
 *
 * runs 与 submissions 的等待逻辑是同一件事：发起 → 反复读取 → 终态收束 →
 * 超时转「仍在进行」。把它抽成一份实现，两个 hook 各自只提供
 * 「怎么读当前状态」和「什么算终态」，避免第二份轮询循环。
 *
 * 返回 `null` 表示组件已卸载（调用方不应再 setState）；
 * 返回 `timedOut: true` 表示「不等了」，但这不等于失败——后端可能仍在跑。
 */
export type PollOutcome<T> = {
  value: T;
  timedOut: boolean;
};

export type PollOptions<T> = {
  intervalMs: number;
  deadlineMs: number;
  isAlive: () => boolean;
  isTerminal: (value: T) => boolean;
  read: (value: T) => Promise<T>;
};

export async function pollToTerminal<T>(initial: T, options: PollOptions<T>): Promise<PollOutcome<T> | null> {
  const deadline = Date.now() + options.deadlineMs;
  let current = initial;

  while (!options.isTerminal(current) && Date.now() < deadline) {
    await sleep(options.intervalMs);
    if (!options.isAlive()) return null;
    current = await options.read(current);
  }

  return { value: current, timedOut: !options.isTerminal(current) };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
