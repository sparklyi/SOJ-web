import { PageShell } from "@/components/layout/page-shell";
import { listSubmissions } from "@/features/submissions/api";
import { SubmissionList } from "@/features/submissions/submission-list";

export default async function SubmissionsPage() {
  const submissions = await listSubmissions();

  return (
    <PageShell title="Submissions" description="Judge queue, verdicts, resource usage, and contest-linked runs.">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border-l border-soj-accent bg-soj-bg-raised px-4 py-3">
            <p className="text-xs text-soj-muted">Total runs</p>
            <p className="font-mono text-2xl text-soj-text">{submissions.total}</p>
          </div>
          <div className="border-l border-soj-line bg-soj-bg-raised px-4 py-3">
            <p className="text-xs text-soj-muted">Accepted</p>
            <p className="font-mono text-2xl text-soj-success">{submissions.items.filter((item) => item.status === "accepted").length}</p>
          </div>
          <div className="border-l border-soj-line bg-soj-bg-raised px-4 py-3">
            <p className="text-xs text-soj-muted">In flight</p>
            <p className="font-mono text-2xl text-soj-accent">{submissions.items.filter((item) => !item.displayState.terminal).length}</p>
          </div>
          <div className="border-l border-soj-line bg-soj-bg-raised px-4 py-3">
            <p className="text-xs text-soj-muted">Contest</p>
            <p className="font-mono text-2xl text-soj-text">SOJ</p>
          </div>
        </div>
        <SubmissionList submissions={submissions.items} />
      </div>
    </PageShell>
  );
}
