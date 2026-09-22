"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { JudgeLanguage } from "@/lib/api/types";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { useI18n } from "@/components/providers/i18n-provider";
import { useBrowserSessionAvailable } from "@/components/auth/use-browser-session";
import { CodeWorkspace, StdinField, type WorkspaceValue } from "@/components/soj/code-workspace";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { createBrowserApiClient } from "@/lib/api/client";
import { getApiMode } from "@/lib/api/mode";
import { listEnabledLanguages } from "@/features/languages/api";
import { RunResultView } from "@/features/runs/run-result-view";
import { useRun } from "@/features/runs/use-run";
import { pickDraft, readDrafts, writeDraft, type PlaygroundDraft } from "./draft-store";

/** 编辑器每次按键都写 localStorage 太重，攒一下再写。 */
const DRAFT_SAVE_DEBOUNCE_MS = 400;

type CatalogState = "loading" | "ready" | "error";

/**
 * 练习场。
 *
 * 它和题目页的提交面板共用同一套运行逻辑与结果渲染（`features/runs`），
 * 差别只有一个：**这里不传 `problemId`**，服务端因此不校验任何题目，
 * 只编译执行源码 + stdin。
 *
 * 页面本身不套 `SessionGate`：访客可以打开、可以看语言目录、可以在编辑器里
 * 敲字（草稿就存在本地），只有「运行」需要登录——运行要占用判题资源。
 * 这与站里「入口公开、内容详情要登录」是同一条规矩，只是练习场没有详情页，
 * 所以门禁落在唯一的动作上。
 */
export function PlaygroundClient() {
  const { t } = useI18n();
  const hasSession = useBrowserSessionAvailable();
  const needsSession = getApiMode() === "http" && !hasSession;

  const [languages, setLanguages] = useState<JudgeLanguage[]>([]);
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");
  const [catalogMessage, setCatalogMessage] = useState("");
  const [edited, setEdited] = useState<WorkspaceValue | null>(null);
  const { state: runState, run, continuePolling } = useRun();

  useEffect(() => {
    listEnabledLanguages(createBrowserApiClient())
      .then((result) => {
        setLanguages(result.items);
        setCatalogState("ready");
      })
      .catch((error: unknown) => {
        setCatalogMessage(
          error instanceof Error
            ? error.message
            : getApiMode() === "http"
              ? t("problems.languageCatalogUnavailableHttp")
              : t("problems.languageCatalogUnavailable"),
        );
        setCatalogState("error");
      });
  }, [t]);

  /**
   * 初始工作区在**渲染期派生**，不用 effect 写 state。
   *
   * 语言目录是异步到达的，所以「第一门语言 + 该语言的草稿」只能在拿到目录后
   * 才成立。用 effect 去 setState 会触发一轮级联渲染，而且顺序上和
   * `CodeWorkspace` 的模板种入打架——`CodeWorkspace` 会把空源码当作未种入
   * 并写入起始模板，先挂载再恢复草稿的话，用户存的代码会被模板顶掉。
   *
   * 派生写法天然没有这个问题：`workspace` 为空时根本不渲染编辑器。
   */
  const restoredWorkspace = useMemo<WorkspaceValue | null>(() => {
    if (languages.length === 0) return null;

    const languageId = languages[0].id;
    const draft = pickDraft(readDrafts(browserStorage()), languageId);
    return {
      languageId,
      // 没有草稿就给空串，交给 CodeWorkspace 种该语言的模板。
      sourceCode: draft?.sourceCode ?? "",
      stdin: draft?.stdin ?? "",
    };
  }, [languages]);

  const workspace = edited ?? restoredWorkspace;

  // 常驻落盘：编辑器与 stdin 的改动攒 400ms 写一次。
  useEffect(() => {
    if (!workspace || workspace.languageId === undefined) return;

    const languageId = workspace.languageId;
    const draft: PlaygroundDraft = { sourceCode: workspace.sourceCode, stdin: workspace.stdin };
    const handle = setTimeout(() => writeDraft(browserStorage(), languageId, draft), DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [workspace]);

  /**
   * 换语言时先落盘旧语言的草稿。
   *
   * 上面的防抖 effect 在依赖变化时会取消尚未触发的写入，所以最后一次按键
   * 有可能丢掉——换语言是唯一会「丢掉旧语言上下文」的动作，必须在这里补一次。
   *
   * 新语言有草稿就恢复它；没有则把 `next` 原样交给 CodeWorkspace，
   * 由它决定是换模板（用户没写过）还是保留源码（用户写过）。
   */
  const handleWorkspaceChange = useCallback(
    (next: WorkspaceValue) => {
      const outgoing = workspace?.languageId;
      if (workspace && outgoing !== undefined && next.languageId !== outgoing) {
        writeDraft(browserStorage(), outgoing, { sourceCode: workspace.sourceCode, stdin: workspace.stdin });

        const restored = pickDraft(readDrafts(browserStorage()), next.languageId);
        if (restored) {
          setEdited({ languageId: next.languageId, sourceCode: restored.sourceCode, stdin: restored.stdin });
          return;
        }
      }
      setEdited(next);
    },
    [workspace],
  );

  const languageId = workspace?.languageId ?? languages[0]?.id;
  const hasCode = Boolean(languageId && workspace?.sourceCode.trim());
  const isRunning = runState.status === "pending";
  const canRun = !needsSession && hasCode && !isRunning;

  const handleRun = useCallback(() => {
    if (needsSession || !workspace || !languageId || !workspace.sourceCode.trim()) return;
    void run({
      languageId,
      sourceCode: workspace.sourceCode,
      stdin: workspace.stdin,
    });
  }, [languageId, needsSession, run, workspace]);

  const catalogNotice = useMemo(() => {
    if (catalogState === "loading") return t("playground.loadingLanguages");
    if (catalogState === "error") return catalogMessage;
    if (languages.length === 0) return t("playground.languageCatalogEmpty");
    return "";
  }, [catalogMessage, catalogState, languages.length, t]);

  return (
    <div className="grid gap-4">
      {catalogNotice ? (
        <p className="rounded-soj-md border border-soj-warning/35 bg-soj-warning/10 px-3 py-2 text-sm text-soj-muted">
          {catalogNotice}
        </p>
      ) : null}

      {/*
        左编辑器、右操作列，整块撑满视口。

        宽度：编辑器拿「全部剩余宽度」，不再套一层 max-width——
        这个页面就是来看代码的，任何居中留白都是从编辑器身上割走的。
        右列固定 340px：只装运行按钮、stdin 和输出，不需要更宽。

        高度：`100dvh - 215px`（导航 69 + 壳内边距 64 + 页头 82）而不是固定
        像素。固定高度配不固定高度的窗口，要么底下留一大块空白，要么把编辑器
        截掉；右列同时是满高 flex 列、输出面板 `flex-1`，两边高度自然对齐。
      */}
      <section className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:h-[calc(100dvh-215px)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[420px] min-h-0 min-w-0 lg:h-full">
          {workspace ? (
            <CodeWorkspace
              languages={languages}
              initialLanguageId={workspace.languageId}
              value={workspace}
              onChange={handleWorkspaceChange}
              fill
              showStdin={false}
            />
          ) : null}
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <Button type="button" size="lg" className="w-full" disabled={!canRun} onClick={handleRun}>
            {needsSession
              ? t("playground.signInToRun")
              : isRunning
                ? t("playground.running")
                : t("playground.runAction")}
          </Button>

          {needsSession ? (
            <p className="text-sm text-soj-muted">
              <LocalizedLink className="text-soj-accent underline-offset-4 hover:underline" href="/auth/login">
                {t("problems.signIn")}
              </LocalizedLink>
            </p>
          ) : null}

          {workspace ? (
            <StdinField
              value={workspace.stdin}
              onChange={(stdin) => handleWorkspaceChange({ ...workspace, stdin })}
              className="min-h-24"
              showHint={false}
            />
          ) : null}

          <Panel variant="flush" className="flex min-h-0 flex-1 flex-col" aria-label={t("playground.output")}>
            <PanelHeader title={t("playground.output")} className="shrink-0" />
            <PanelBody className="min-h-0 flex-1 overflow-auto">
              {runState.status === "idle" ? (
                <p className="text-sm text-soj-muted">{t("playground.outputIdle")}</p>
              ) : (
                <RunResultView state={runState} onContinuePolling={() => void continuePolling()} />
              )}
            </PanelBody>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function browserStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}
