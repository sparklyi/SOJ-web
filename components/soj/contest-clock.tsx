import { StatusPill } from "./status-pill";

type ContestClockProps = {
  label: string;
  value: string;
  frozen?: boolean;
};

export function ContestClock({ label, value, frozen = false }: ContestClockProps) {
  return (
    <div className="soj-contest-access p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-soj-muted">{label}</span>
        {frozen ? <StatusPill tone="warning">Frozen</StatusPill> : <StatusPill tone="accent">Live</StatusPill>}
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-soj-text">{value}</div>
    </div>
  );
}
