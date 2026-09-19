import { MotionBlock } from "@/components/fx/motion-block";
import { PageShell } from "@/components/layout/page-shell";
import { ActiveContests } from "@/features/home/active-contests";
import { HomeHero } from "@/features/home/home-hero";
import { RecentJudgeFeed } from "@/features/home/recent-judge-feed";
import { RecommendedProblems } from "@/features/home/recommended-problems";
import { listContests } from "@/features/contests/api";
import { listProblems } from "@/features/problems/api";
import { listSubmissions } from "@/features/submissions/api";
import type { ProblemDifficulty } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { getServerTranslator } from "@/lib/i18n/server";

const difficultyRank: Record<ProblemDifficulty, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * 首页。
 *
 * 它只回答新访客的三个问题，一个问题一层，问完即止：
 *   这是什么、值不值得留下 —— 首屏（定位 + 两个入口 + 两条事实）
 *   现在有什么正在发生     —— 进行中的比赛（全站时效性最强的信息）
 *   我该从哪开始 / 别人在做什么 —— 推荐题目 + 最近评测
 *
 * 上一版把「评测概览」也搬上了首页：全站提交总数、全站通过率、难度构成、
 * 提交量排行。那是**运营看板，不是入口**——新访客不关心这个站累计被提交过多少次，
 * 而关注意味着首页要在一屏里塞进五个面板，每一块只剩五分之一的注意力。
 *
 * 这类聚合数据应该放在它能被**用来做决定**的地方：难度构成属于题库页
 * （在那里它是筛选依据），而「提交量排行」哪儿都不属于，删掉即可。
 *
 * 布局也不用通栏 + 两栏混排：比赛是全站唯一带倒计时、错过就没有的内容，
 * 给它整宽；剩下的「做什么」和「发生了什么」是一对，天然两栏。
 */
export default async function HomePage() {
  const t = await getServerTranslator();
  const [{ items: contests }, { items: problems }, submissionsResult] = await Promise.all([
    listContests(),
    listProblems(),
    listVisibleSubmissions(),
  ]);
  const submissions = submissionsResult.items;

  const liveContests = contests.filter((contest) => contest.status === "running" || contest.status === "frozen");
  const upcomingContests = contests
    .filter((contest) => contest.status === "scheduled")
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const shownContests = liveContests.length > 0 ? liveContests : upcomingContests;

  // 「从哪开始」按难度递进排序，而不是按接口返回顺序随便切三条：
  // 推荐位如果不解释自己为什么推荐，读者只会把它当成随机内容。
  const recommendedProblems = problems
    .filter((problem) => problem.status !== "accepted")
    .sort((a, b) => difficultyRank[a.difficulty] - difficultyRank[b.difficulty])
    .slice(0, 4);
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <PageShell>
      <div className="grid min-w-0 gap-6">
        <HomeHero
          facts={[
            { label: t("home.problems"), value: problems.length },
            { label: t("contest.active"), value: liveContests.length },
          ]}
        />

        <MotionBlock>
          <ActiveContests contests={shownContests} mode={liveContests.length > 0 ? "live" : "upcoming"} />
        </MotionBlock>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)] xl:items-start">
          <MotionBlock delay={60}>
            <RecommendedProblems problems={recommendedProblems} />
          </MotionBlock>
          <MotionBlock delay={120}>
            <RecentJudgeFeed submissions={recentSubmissions} />
          </MotionBlock>
        </div>
      </div>
    </PageShell>
  );
}

async function listVisibleSubmissions() {
  try {
    return await listSubmissions();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { items: [], total: 0 };
    throw error;
  }
}
