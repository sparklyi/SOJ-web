"use client";

import { useEffect, useState } from "react";
import { Inbox, Loader } from "lucide-react";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Stat, StatDivider, StatGroup } from "@/components/ui/stat";
import { createBrowserApiClient } from "@/lib/api/client";
import { listSubmissions } from "./api";
import { SubmissionList } from "./submission-list";

type SubmissionListResult = Awaited<ReturnType<typeof listSubmissions>>;

type SubmissionListState =
  | { status: "loading" }
  | { status: "ready"; submissions: SubmissionListResult }
  | { status: "auth" }
  | { status: "error"; message: string };

/**
 * 提交记录页。
 *
 * 这一页原先在表格之前堆了三块东西：一个「N 次运行已进入 SOJ」的徽标、
 * 一排四个指标（运行总数 / 通过 / 处理中 / 已结束）、一张「最近一次运行」卡片、
 * 外加一条四段式评测流水线（排队 / 编译 / 运行 / 结果），每段带一个计数。
 * 也就是说：打开页面先读完一屏统计，才看到自己要找的那条提交。
 *
 * 砍掉它们依据的是同一个判断——**这些数字要么表格里已经有了，要么不负责任何决定**：
 *   · 「最近一次运行」就是表格的第一行，单独做一张卡片只是把同一行放大一遍；
 *   · 四段流水线的计数，逐行看表格的「结果」列本来就能得到，
 *     而且待判的提交会直接显示它卡在哪一步；
 *   · 「已结束」= 总数 − 处理中，一个减法不需要占一格。
 *
 * 留下的三个数字回答了三个真问题：我一共交过多少次、过了多少、还有多少在跑。
 * 页头之后就是表格，中间不再夹任何东西。
 */
export function SubmissionListClient() {
  const { t } = useI18n();
  const [state, setState] = useState<SubmissionListState>({ status: "loading" });

  useEffect(() => {
    listSubmissions(createBrowserApiClient())
      .then((submissions) => setState({ status: "ready", submissions }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t("submissions.loading.error");
        if (message.toLowerCase().includes("auth")) {
          setState({ status: "auth" });
          return;
        }
        setState({ status: "error", message });
      });
  }, [t]);

  const submissions = state.status === "ready" ? state.submissions : { items: [], total: 0 };
  const acceptedCount = submissions.items.filter((item) => item.status === "accepted").length;
  const inFlightCount = submissions.items.filter((item) => !item.displayState.terminal).length;

  return (
    <PageShell>
      <div className="grid gap-6">
        <PageHeader
          eyebrow={t("submissions.page.badge")}
          title={t("submissions.page.title")}
          description={t("submissions.page.description")}
          actions={
            state.status === "auth" ? (
              <LocalizedLink className={buttonVariants({ variant: "solid", size: "sm" })} href="/auth/login">
                {t("submissions.action.login")}
              </LocalizedLink>
            ) : null
          }
          meta={
            state.status === "ready" ? (
              <StatGroup>
                <Stat label={t("submissions.metric.totalRuns")} value={submissions.total} />
                <StatDivider />
                <Stat label={t("submissions.metric.accepted")} value={acceptedCount} tone="success" />
                <StatDivider />
                <Stat label={t("submissions.metric.inFlight")} value={inFlightCount} tone="accent" />
              </StatGroup>
            ) : null
          }
        />

        {state.status === "ready" ? <SubmissionList submissions={submissions.items} /> : <SubmissionLoadState state={state} />}
      </div>
    </PageShell>
  );
}

function SubmissionLoadState({ state }: { state: SubmissionListState }) {
  const { t } = useI18n();
  const title =
    state.status === "loading"
      ? t("submissions.loading.queue")
      : state.status === "auth"
        ? t("submissions.loading.loginRequired")
        : t("submissions.loading.unable");
  const message =
    state.status === "loading"
      ? t("submissions.loading.reading")
      : state.status === "auth"
        ? t("submissions.loading.protected")
        : state.status === "error"
          ? state.message
          : t("submissions.loading.ready");

  if (state.status === "loading") {
    return (
      <Panel variant="flush">
        <EmptyState icon={Loader} title={title} description={message} />
      </Panel>
    );
  }

  if (state.status === "auth") {
    return (
      <Panel variant="flush">
        <EmptyState
          icon={Inbox}
          title={title}
          description={message}
          action={
            <LocalizedLink className={buttonVariants({ variant: "solid", size: "sm" })} href="/auth/login">
              {t("submissions.action.login")}
            </LocalizedLink>
          }
        />
      </Panel>
    );
  }

  return (
    <Panel variant="flush">
      <EmptyState icon={Inbox} title={title} description={message} />
    </Panel>
  );
}
