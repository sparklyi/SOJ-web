import { ContestClock } from "@/components/soj/contest-clock";
import { ProblemStatus } from "@/components/soj/problem-status";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SignalFeed } from "@/components/soj/signal-feed";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { VerdictBadge } from "@/components/soj/verdict-badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MessageKey } from "@/lib/i18n/messages";
import { getServerTranslator } from "@/lib/i18n/server";

const swatches = [
  ["style.background", "bg-soj-bg"],
  ["style.raised", "bg-soj-bg-raised"],
  ["style.surface", "bg-soj-surface"],
  ["style.surface2", "bg-soj-surface-2"],
  ["style.accent", "bg-soj-accent"],
  ["style.success", "bg-soj-success"],
  ["style.warning", "bg-soj-warning"],
  ["style.danger", "bg-soj-danger"],
] as const satisfies ReadonlyArray<readonly [MessageKey, string]>;

export default async function StyleGuidePage() {
  const t = await getServerTranslator();

  return (
    <main className="min-h-dvh bg-soj-bg px-5 py-8 text-soj-text md:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10">
        <header className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 border-b border-soj-line pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-soj-accent">{t("style.signalArenaSystem")}</p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">{t("style.interfaceBaseline")}</h1>
          <p className="max-w-2xl text-base leading-7 text-soj-muted">{t("style.description")}</p>
        </header>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">{t("style.tokens")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map(([labelKey, className]) => (
              <div key={labelKey} className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-4">
                <div className={`${className} h-16 rounded-soj-md border border-soj-line`} />
                <div className="mt-3 font-mono text-xs text-soj-muted">{t(labelKey)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">{t("style.typography")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <p className="text-3xl font-semibold tracking-tight">{t("style.sansHierarchy")}</p>
            <p className="font-mono text-sm text-soj-accent">{t("style.monoState")}</p>
            <p className="max-w-2xl leading-7 text-soj-muted">{t("style.bodyCopy")}</p>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">{t("style.controls")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <div className="flex flex-wrap gap-3">
              <Button>{t("common.submit")}</Button>
              <Button variant="secondary">{t("common.preview")}</Button>
              <Button variant="ghost">{t("common.cancel")}</Button>
              <Button variant="danger">{t("common.delete")}</Button>
              <Button loading>{t("style.judging")}</Button>
              <IconButton label={t("common.refresh")}>R</IconButton>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
              <Input id="handle" label={t("style.handle")} helperText={t("style.handleHelper")} />
              <Input id="token" label={t("style.contestCode")} error={t("style.registrationRequired")} />
            </div>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">{t("style.stateComponents")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <div className="flex flex-wrap gap-2">
              <VerdictBadge status="queued" />
              <VerdictBadge status="running" />
              <VerdictBadge status="accepted" />
              <VerdictBadge status="wrong_answer" />
              <VerdictBadge status="compile_error" />
              <ProblemStatus status="accepted" />
            </div>
            <SubmissionTimeline
              items={[
                { id: "queued", status: "queued", label: "", labelKey: "style.queuedByJudge", timestamp: "10:12:01" },
                { id: "running", status: "running", label: "", labelKey: "style.runningTestPoints", timestamp: "10:12:05" },
                { id: "accepted", status: "accepted", label: "", labelKey: "status.accepted", timestamp: "10:12:09" },
              ]}
            />
            <TestPointMatrix
              points={[
                { index: 1, status: "accepted", score: 10 },
                { index: 2, status: "accepted", score: 10 },
                { index: 3, status: "running", score: 0 },
                { index: 4, status: "wrong_answer", score: 0 },
              ]}
            />
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">{t("style.contestSurfaces")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_1fr]">
            <ContestClock label={t("contest.freezeIn")} value="00:42:18" />
            <SignalFeed
              items={[
                { id: "a", label: t("home.rankMovement"), value: "+3", tone: "accent" },
                { id: "b", label: t("style.latestAccepted"), value: t("style.problemC"), tone: "success" },
                { id: "c", label: t("style.frozenSubmissions"), value: "17", tone: "warning" },
              ]}
            />
          </div>
          <div className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <ScoreboardGrid
              mode="acm"
              rows={[
                { id: "1", rank: 1, handle: "lin", solved: 5, penalty: 312, movement: 2 },
                { id: "2", rank: 2, handle: "mira", solved: 4, penalty: 260, movement: -1 },
              ]}
            />
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">{t("style.loadingDataRows")}</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <Skeleton className="h-10" />
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">{t("style.table")}</TabsTrigger>
                <TabsTrigger value="empty">{t("style.empty")}</TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t("home.problem")}</TableHeaderCell>
                      <TableHeaderCell>{t("home.status")}</TableHeaderCell>
                      <TableHeaderCell>{t("home.recent")}</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    <TableRow>
                      <TableCell>{t("style.signalPath")}</TableCell>
                      <TableCell><ProblemStatus status="attempted" /></TableCell>
                      <TableCell className="font-mono">47.2%</TableCell>
                    </TableRow>
                  </tbody>
                </Table>
              </TabsContent>
              <TabsContent value="empty">
                <div className="rounded-soj-md border border-soj-line bg-soj-surface p-5 text-sm text-soj-muted">{t("style.noMatchingSubmissions")}</div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  );
}
