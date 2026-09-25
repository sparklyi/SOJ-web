"use client";

import { useRef } from "react";
import type { JudgeLanguage, ProblemDetail } from "@/lib/api/types";
import { getAcceptanceRate, problemStatusLabelKey } from "@/lib/domain/problem";
import { AcceptanceAxis } from "@/components/soj/acceptance-axis";
import { DifficultyLabel } from "@/components/soj/difficulty-composition";
import { ProblemStatement } from "@/components/soj/problem-statement";
import { ProblemStatus } from "@/components/soj/problem-status";
import { PageHeader } from "@/components/ui/page-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { formatDuration, formatMemory, formatNumber } from "@/lib/ui/number";
import { ProblemSubmitPanelLoader } from "./problem-submit-panel-loader";
import type { ProblemSubmitHandle } from "./problem-submit-panel";

type ProblemDetailViewProps = {
  problem: ProblemDetail;
  languages?: JudgeLanguage[];
};

/**
 * 题目详情。
 *
 * 版式分两层：页头承担「这道题是什么」（编号、标题、难度、限制与统计），
 * 下面才是工作区——左阅读右提交。
 *
 * 旧实现把 `text-6xl` 的大标题、时限胶囊、四个带边框的指标格全塞进
 * 阅读面板里，同一个面板既当页头又当正文，于是标题和表格抢地方；
 * 指标也重复出现在提交侧栏。现在指标只在页头出现一次，
 * 提交侧栏只保留「你要做什么」。
 *
 * 页头右侧的通过率标尺与题库页头的难度构成条是同一套思路：
 * 每个页头带且只带一个数据图形。它让页面在「一堆文字行」之外有一个
 * 能被视觉记住的锚点，也让抽象百分比有了位置感。
 */
export function ProblemDetailView({ problem, languages = [] }: ProblemDetailViewProps) {
  const { t, locale } = useI18n();
  const acceptance = getAcceptanceRate(problem);
  // 题面示例的「填入自定义输入」要落到右侧编辑器，用命令式句柄把两边接起来，
  // 不把编辑器状态提升成整页共享 state。
  const submitRef = useRef<ProblemSubmitHandle>(null);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`#${problem.id} · ${problem.slug}`}
        title={problem.title}
        actions={
          <>
            <ProblemStatus status={problem.status} label={t(problemStatusLabelKey[problem.status])} />
            <DifficultyLabel difficulty={problem.difficulty} t={t} />
          </>
        }
        meta={
          <div className="grid w-full gap-5 lg:grid-cols-[auto_minmax(0,22rem)] lg:items-center lg:justify-between">
            <StatGroup>
              <Stat label={t("problems.time")} value={formatDuration(problem.timeLimitMs, locale)} />
              <StatDivider />
              <Stat label={t("problems.memory")} value={formatMemory(problem.memoryLimitKb, locale)} />
              <StatDivider />
              <Stat label={t("problems.submissions")} value={formatNumber(problem.submissionCount, { locale })} tone="faint" />
            </StatGroup>
            <AcceptanceAxis value={acceptance} label={t("problems.acceptance")} locale={locale} />
          </div>
        }
      />
      {/* 侧栏要装下代码编辑器：lg 26rem 起，xl 30rem，阅读栏相应让位。
          编辑区是提交面板的主角，比统计块更需要水平空间。 */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_30rem]">
        <ProblemStatement problem={problem} t={t} onUseExampleInput={(text) => submitRef.current?.fillStdin(text)} />
        <ProblemSubmitPanelLoader ref={submitRef} initialLanguages={languages} problem={problem} />
      </div>
    </div>
  );
}
