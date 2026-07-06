import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContestClock } from "@/components/soj/contest-clock";
import { ProblemStatus } from "@/components/soj/problem-status";
import { ScoreboardGrid } from "@/components/soj/scoreboard-grid";
import { SignalFeed } from "@/components/soj/signal-feed";
import { SubmissionTimeline } from "@/components/soj/submission-timeline";
import { TestPointMatrix } from "@/components/soj/test-point-matrix";
import { VerdictBadge } from "@/components/soj/verdict-badge";

const swatches = [
  ["Background", "bg-soj-bg"],
  ["Raised", "bg-soj-bg-raised"],
  ["Surface", "bg-soj-surface"],
  ["Surface 2", "bg-soj-surface-2"],
  ["Accent", "bg-soj-accent"],
  ["Success", "bg-soj-success"],
  ["Warning", "bg-soj-warning"],
  ["Danger", "bg-soj-danger"],
];

export default function StyleGuidePage() {
  return (
    <main className="min-h-dvh bg-soj-bg px-5 py-8 text-soj-text md:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10">
        <header className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 border-b border-soj-line pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-soj-accent">Signal Arena System</p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">SOJ interface baseline</h1>
          <p className="max-w-2xl text-base leading-7 text-soj-muted">
            This page is the visual contract for workers building v2 routes. Use these tokens, controls, and status patterns.
          </p>
        </header>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">Tokens</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {swatches.map(([label, className]) => (
              <div key={label} className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-4">
                <div className={`${className} h-16 rounded-soj-md border border-soj-line`} />
                <div className="mt-3 font-mono text-xs text-soj-muted">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">Typography</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <p className="text-3xl font-semibold tracking-tight">Sans drives product hierarchy.</p>
            <p className="font-mono text-sm text-soj-accent">Mono drives verdicts, ranks, timers, and numeric state.</p>
            <p className="max-w-2xl leading-7 text-soj-muted">Body copy stays concise, functional, and readable in dense contest surfaces.</p>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">Controls</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <div className="flex flex-wrap gap-3">
              <Button>Submit</Button>
              <Button variant="secondary">Preview</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Delete</Button>
              <Button loading>Judging</Button>
              <IconButton label="Refresh">R</IconButton>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
              <Input id="handle" label="Handle" helperText="Shown on public scoreboards." />
              <Input id="token" label="Contest code" error="Registration is required." />
            </div>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
          <h2 className="text-xl font-semibold">State Components</h2>
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
                { id: "queued", status: "queued", label: "Queued by judge", timestamp: "10:12:01" },
                { id: "running", status: "running", label: "Running test points", timestamp: "10:12:05" },
                { id: "accepted", status: "accepted", label: "Accepted", timestamp: "10:12:09" },
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
          <h2 className="text-xl font-semibold">Contest Surfaces</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_1fr]">
            <ContestClock label="Freeze in" value="00:42:18" />
            <SignalFeed
              items={[
                { id: "a", label: "Rank movement", value: "+3", tone: "accent" },
                { id: "b", label: "Latest accepted", value: "Problem C", tone: "success" },
                { id: "c", label: "Frozen submissions", value: "17", tone: "warning" },
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
          <h2 className="text-xl font-semibold">Loading And Data Rows</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
            <Skeleton className="h-10" />
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="empty">Empty</TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Problem</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Rate</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <tbody>
                    <TableRow>
                      <TableCell>Signal Path</TableCell>
                      <TableCell>
                        <ProblemStatus status="attempted" />
                      </TableCell>
                      <TableCell className="font-mono">47.2%</TableCell>
                    </TableRow>
                  </tbody>
                </Table>
              </TabsContent>
              <TabsContent value="empty">
                <div className="rounded-soj-md border border-soj-line bg-soj-surface p-5 text-sm text-soj-muted">
                  No submissions match this filter.
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  );
}
