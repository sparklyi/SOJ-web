import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { listProblems } from "@/features/problems/api";
import { ProblemListClient } from "@/features/problems/problem-list-client";
import { getServerTranslator } from "@/lib/i18n/server";
import { parseProblemFilter } from "@/lib/domain/problem";

/**
 * 题库页。
 *
 * 题目是公共资产：published+public 的题目由服务端匿名取数、随页面一起输出，
 * 未登录访客与搜索引擎都能直接读到内容——这是站点曝光的主要落点。
 * 匿名可读的边界在后端 `canReadProblem`：私有/未发布题仍是 404；
 * 提交、提交记录、测试数据一律需要登录。
 *
 * 页码与筛选条件来自 URL，每次只读取后端的一页及匹配总数。
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return { title: t("problems.pageTitle") };
}

export default async function ProblemsPage({ searchParams, params }: { searchParams: Promise<Record<string, string | string[] | undefined>>; params: Promise<{ locale: string }> }) {
  const query = await searchParams;
  const filter = parseProblemFilter(query);
  const problems = await listProblems(filter);
  const lastPage = Math.max(1, Math.ceil(problems.total / filter.pageSize));
  if (filter.page > lastPage) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) next.set(key, Array.isArray(value) ? value[0] : value);
    }
    next.set("page", String(lastPage));
    redirect(`/${(await params).locale}/problems?${next.toString()}`);
  }

  return (
    <PageShell>
      <ProblemListClient initialProblems={problems} filter={filter} />
    </PageShell>
  );
}
