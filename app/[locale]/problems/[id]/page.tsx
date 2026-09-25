import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { getProblem } from "@/features/problems/api";
import { ProblemDetailView } from "@/features/problems/problem-detail-view";
import { isNotFoundError } from "@/lib/api/errors";

/**
 * 题目详情页。
 *
 * 与题库页同理：published+public 的题面由服务端匿名取数并直接渲染，
 * 未登录访客与搜索引擎都能读到；提交侧栏是客户端孤岛，未登录时转为登录引导。
 *
 * `cache` 让 metadata 与页面正文共享同一次取数，避免为了一份标题打两次接口。
 * 非数字 id 或后端 404 都走 `notFound()`，由框架渲染整页空态。
 */
const loadProblem = cache((problemId: number) => getProblem(problemId));

// 取数与「不存在」判定单独成函数：JSX 在 try/catch 里构造会被 react-hooks 规则拦下，
// 而且渲染不该和错误映射混在一起。
async function loadProblemOrNotFound(problemId: number) {
  try {
    return await loadProblem(problemId);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const problemId = Number(id);
  if (!Number.isInteger(problemId)) return {};

  try {
    const problem = await loadProblem(problemId);
    return { title: problem.title };
  } catch {
    return {};
  }
}

export default async function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problemId = Number(id);

  if (!Number.isInteger(problemId)) {
    notFound();
  }

  const problem = await loadProblemOrNotFound(problemId);

  return (
    <PageShell>
      <ProblemDetailView problem={problem} />
    </PageShell>
  );
}
