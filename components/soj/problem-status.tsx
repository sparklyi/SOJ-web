import type { ProblemStatus as ProblemStatusValue } from "@/lib/api/types";
import { StatusPill } from "./status-pill";

const labels: Record<ProblemStatusValue, string> = {
  todo: "Todo",
  attempted: "Attempted",
  accepted: "Solved",
};

export function ProblemStatus({ status }: { status: ProblemStatusValue }) {
  return <StatusPill tone={status === "accepted" ? "success" : status === "attempted" ? "warning" : "neutral"}>{labels[status]}</StatusPill>;
}
