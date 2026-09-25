import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { listProblems } from "@/features/problems/api";
import { ProblemListClient } from "@/features/problems/problem-list-client";
import { getServerTranslator } from "@/lib/i18n/server";

/**
 * 题库页。
 *
 * 题目是公共资产：published+public 的题目由服务端匿名取数、随页面一起输出，
 * 未登录访客与搜索引擎都能直接读到内容——这是站点曝光的主要落点。
 * 匿名可读的边界在后端 `canReadProblem`：私有/未发布题仍是 404；
 * 提交、提交记录、测试数据一律需要登录。
 *
 * 服务端只取一次全量列表，searchParams 驱动的筛选在客户端内存里完成，
 * 换筛选不重新拉数据。
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return { title: t("problems.pageTitle") };
}

export default async function ProblemsPage() {
  const problems = await listProblems();

  return (
    <PageShell>
      <ProblemListClient initialProblems={problems} />
    </PageShell>
  );
}
