import type { ContestSummary, ProblemDetail, SubmissionSummary } from "@/lib/api/types";
import type { AcmScoreboardRow } from "@/lib/domain/scoreboard";

/**
 * 比赛时间按「整点」锚定到当前时刻。
 *
 * 固定写死日期的 mock 数据会随时间腐坏：一个标注「运行中」的比赛，
 * 其窗口却是两个月前，界面上就会出现「进度条 100% + 状态运行中」这种自相矛盾的画面。
 * 按小时取整（而不是直接 Date.now()）是为了让服务端与客户端算出同一组时间，
 * 避免渲染出不同的日期文本而触发水合告警。
 */
function hourAnchor() {
  return Math.floor(Date.now() / 3_600_000) * 3_600_000;
}

/** 相对当前整点的偏移时刻，供夹具组装时间窗口。 */
export function hoursFromNow(hours: number) {
  return new Date(hourAnchor() + hours * 3_600_000).toISOString();
}

/**
 * 分钟粒度的相对时刻。
 *
 * 提交记录必须彼此错开：全表共用同一个 `hoursFromNow(-1)` 会让「提交时间」这一列
 * 变成 8 个完全相同的 ":00"，读者一眼就知道这页是编出来的——
 * 而这个破绽比任何配色问题都更容易被看穿。
 * 整点锚点保证服务端与客户端算出同一串分钟值，不会触发水合告警。
 */
export function minutesFromNow(minutes: number) {
  return new Date(hourAnchor() + minutes * 60_000).toISOString();
}

/**
 * 标题 → 短标识。
 *
 * 旧实现把 slug 写死成 `shortest-path-${id}`，于是「Cache Relay」的地址栏里
 * 写着 shortest-path-2、「Frozen Matrix」写着 shortest-path-3。伪造的痕迹
 * 不在配色里，就在这种地方——用户点开一道题，看到的短标识和题名毫无关系。
 */
function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildProblem(overrides: Partial<ProblemDetail> = {}): ProblemDetail {
  const id = overrides.id ?? 1;
  const title = overrides.title ?? `Shortest Path ${id}`;
  return {
    id,
    title,
    slug: slugify(title) || `problem-${id}`,
    difficulty: "medium",
    tags: ["graphs", "shortest-path"],
    status: "todo",
    acceptedCount: 184 + id,
    submissionCount: 421 + id * 3,
    statement:
      "在带权有向图中，求两个结点之间的最小代价路径。若 $u \\to v$ 的边权为 $w$，代价即路径上边权之和。",
    input: "第一行两个整数 $n$ 和 $m$。接下来 $m$ 行，每行一条带权有向边。",
    output: "输出从源点到目标点的最小代价。若不可达，输出 `-1`；数据保证 $1 \\le w \\le 10^9$。",
    examples: [
      { input: "4 4\n1 2 5\n2 4 7\n1 3 2\n3 4 4", output: "6" },
      { input: "3 2\n1 2 10\n2 3 5", output: "15" },
    ],
    constraints: ["1 <= n <= 200000", "1 <= m <= 400000"],
    timeLimitMs: 1000,
    memoryLimitKb: 262144,
    ...overrides,
  };
}

export function buildContest(overrides: Partial<ContestSummary> = {}): ContestSummary {
  const anchor = hourAnchor();
  const at = (hours: number) => new Date(anchor + hours * 3_600_000).toISOString();
  return {
    id: overrides.id ?? 1,
    ownerUserId: overrides.ownerUserId ?? 1,
    title: "Sundial Weekly Contest",
    status: "running",
    startsAt: at(-2),
    endsAt: at(3),
    freezeAt: at(1),
    registered: true,
    currentUserRoles: [],
    problems: [
      { problemId: 1, alias: "A", title: "Shortest Path" },
      { problemId: 2, alias: "B", title: "Cache Relay" },
      { problemId: 3, alias: "C", title: "Frozen Matrix" },
    ],
    ...overrides,
  };
}

export function buildSubmission(overrides: Partial<SubmissionSummary> = {}): SubmissionSummary {
  return {
    id: overrides.id ?? 1,
    problemId: 1,
    problemTitle: "Shortest Path",
    contestTitle: "Sundial Weekly Contest",
    contestId: 1,
    status: "running",
    submittedAt: minutesFromNow(-12),
    ...overrides,
  };
}

/**
 * 排行榜一行。
 *
 * 默认值必须**自洽**：`solved` 是下面三个单元格里 accepted 的个数，
 * `penalty` 是各题解出分钟数加罚时。
 */
export function buildAcmScoreboardRow(overrides: Partial<AcmScoreboardRow> = {}): AcmScoreboardRow {
  return {
    id: overrides.id ?? "team-1",
    handle: "lin-chen",
    solved: 1,
    penalty: 42,
    movement: 2,
    problems: [
      { problemId: 1, alias: "A", status: "accepted", attempts: 1, penalty: 42 },
      { problemId: 2, alias: "B", status: "wrong_answer", attempts: 2 },
      { problemId: 3, alias: "C", status: "pending", attempts: 1 },
    ],
    ...overrides,
  };
}
