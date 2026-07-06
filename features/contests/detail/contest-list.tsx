import Link from "next/link";
import { SignalFeed } from "@/components/soj/signal-feed";
import { StatusPill } from "@/components/soj/status-pill";
import { Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { getContestDurationMinutes } from "@/lib/domain/contest";
import type { ContestStatus, ContestSummary, ContestType } from "@/lib/api/types";

type ContestListItem = ContestSummary & {
  canRegister: boolean;
  canSubmit: boolean;
};

type ContestListProps = {
  contests: ContestListItem[];
};

const statusView: Record<ContestStatus, { label: string; tone: React.ComponentProps<typeof StatusPill>["tone"]; signal: string }> = {
  scheduled: { label: "Scheduled", tone: "info", signal: "Registration open" },
  running: { label: "Running", tone: "accent", signal: "Live submissions" },
  frozen: { label: "Frozen", tone: "warning", signal: "Scoreboard hidden" },
  ended: { label: "Ended", tone: "neutral", signal: "Submissions closed" },
  unsealed: { label: "Unsealed", tone: "success", signal: "Final ranks public" },
};

const typeLabel: Record<ContestType, string> = {
  acm: "ACM",
  oi: "OI/IOI",
};

export function ContestList({ contests }: ContestListProps) {
  const liveCount = contests.filter((contest) => contest.status === "running" || contest.status === "frozen").length;
  const registeredCount = contests.filter((contest) => contest.registered).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section aria-label="Contest signal summary" className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
        <div className="rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5">
          <h2 className="text-xl font-semibold">Contest queue</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-soj-muted">
            Track active rounds, registration windows, freeze state, and the next route into the contest cockpit.
          </p>
        </div>
        <SignalFeed
          items={[
            { id: "total", label: "Listed contests", value: String(contests.length), tone: "neutral" },
            { id: "live", label: "Live or frozen", value: String(liveCount), tone: liveCount > 0 ? "accent" : "neutral" },
            { id: "registered", label: "Registered", value: String(registeredCount), tone: registeredCount > 0 ? "success" : "neutral" },
          ]}
        />
      </section>

      <section aria-label="Contest list" className="overflow-hidden rounded-soj-lg border border-soj-line bg-soj-bg-raised">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Contest</TableHeaderCell>
              <TableHeaderCell>Lifecycle</TableHeaderCell>
              <TableHeaderCell>Format</TableHeaderCell>
              <TableHeaderCell>Window</TableHeaderCell>
              <TableHeaderCell>Access</TableHeaderCell>
              <TableHeaderCell>Entry</TableHeaderCell>
            </tr>
          </TableHead>
          <tbody>
            {contests.map((contest) => {
              const status = statusView[contest.status];
              return (
                <TableRow key={contest.id}>
                  <TableCell>
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-1">
                      <Link href={`/contests/${contest.id}`} className="font-medium text-soj-text transition hover:text-soj-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent">
                        {contest.title}
                      </Link>
                      <span className="text-xs text-soj-muted">{status.signal}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </TableCell>
                  <TableCell className="font-mono text-soj-muted">{typeLabel[contest.type]}</TableCell>
                  <TableCell className="font-mono text-soj-muted">{formatDuration(getContestDurationMinutes(contest))}</TableCell>
                  <TableCell>
                    {contest.registered ? (
                      <StatusPill tone="success">Registered</StatusPill>
                    ) : contest.canRegister ? (
                      <StatusPill tone="accent">Can register</StatusPill>
                    ) : (
                      <StatusPill tone="warning">Locked</StatusPill>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/contests/${contest.id}`} className="font-medium text-soj-accent transition hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent" aria-label={`Open ${contest.title}`}>
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </section>
    </div>
  );
}

function formatDuration(minutes: number) {
  if (minutes <= 0) return "Unset";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}
