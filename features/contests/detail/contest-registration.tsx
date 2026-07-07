import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/soj/status-pill";
import type { ContestStatus, ContestSummary } from "@/lib/api/types";

type ContestRegistrationProps = {
  contest: ContestSummary & {
    canRegister: boolean;
    canSubmit: boolean;
  };
};

const hintByStatus: Record<ContestStatus, string> = {
  scheduled: "Register before the start window to unlock contest problems and submissions.",
  running: "Submissions are accepted for registered participants while the contest is live.",
  frozen: "Submissions remain open for registered participants, but public ranks are frozen.",
  ended: "The contest window has closed. Problems are available for review when permitted.",
  unsealed: "Final ranks are public and the contest is available for post-contest review.",
};

export function ContestRegistration({ contest }: ContestRegistrationProps) {
  const firstProblemId = contest.problems[0]?.problemId;

  return (
    <section aria-label="Contest access" className="soj-contest-access grid grid-cols-[minmax(0,1fr)] gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Access</h2>
        {contest.registered ? <StatusPill tone="success">Registered</StatusPill> : <StatusPill tone={contest.canRegister ? "accent" : "warning"}>{contest.canRegister ? "Registration open" : "Registration closed"}</StatusPill>}
      </div>

      <p className="text-sm leading-6 text-soj-muted">{hintByStatus[contest.status]}</p>

      {contest.canRegister ? (
        <Button type="button" size="lg">Register</Button>
      ) : contest.canSubmit && firstProblemId ? (
        <form action={`/contests/${contest.id}/problems/${firstProblemId}`}>
          <Button type="submit" size="lg">Enter contest</Button>
        </form>
      ) : (
        <Button type="button" size="lg" variant="secondary" disabled>
          Read only
        </Button>
      )}
    </section>
  );
}
