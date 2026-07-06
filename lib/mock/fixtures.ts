import type { ContestSummary, CurrentUser, ProblemDetail, SubmissionSummary } from "@/lib/api/types";
import { buildContest, buildProblem, buildSubmission } from "./builders";

export const mockUser: CurrentUser = {
  id: 7,
  handle: "lin-chen",
  displayName: "Lin Chen",
  role: "user",
};

export const mockProblems: ProblemDetail[] = [
  buildProblem({ id: 1, title: "Signal Path", difficulty: "easy", status: "accepted", tags: ["graphs"] }),
  buildProblem({ id: 2, title: "Cache Relay", difficulty: "medium", status: "attempted", tags: ["dp"] }),
  buildProblem({ id: 3, title: "Frozen Matrix", difficulty: "hard", tags: ["matrix", "optimization"] }),
  buildProblem({ id: 4, title: "Judge Queue", difficulty: "medium", tags: ["simulation"] }),
  buildProblem({ id: 5, title: "Rank Delta", difficulty: "hard", tags: ["data-structures"] }),
  buildProblem({ id: 6, title: "Binary Beacon", difficulty: "easy", tags: ["bitmask"] }),
  buildProblem({ id: 7, title: "Memory Gate", difficulty: "medium", tags: ["greedy"] }),
  buildProblem({ id: 8, title: "Arena Clock", difficulty: "hard", tags: ["math"] }),
];

export const mockContests: ContestSummary[] = [
  buildContest({ id: 1, title: "SOJ Signal Cup", type: "acm", status: "running" }),
  buildContest({ id: 2, title: "OI Calibration Round", type: "oi", status: "frozen", registered: false }),
];

export const mockSubmissions: SubmissionSummary[] = [
  buildSubmission({ id: 1, status: "queued", score: 0 }),
  buildSubmission({ id: 2, status: "compiling", score: 0 }),
  buildSubmission({ id: 3, status: "running", score: 0 }),
  buildSubmission({ id: 4, status: "accepted", score: 100, timeMs: 42, memoryKb: 8192 }),
  buildSubmission({ id: 5, status: "wrong_answer", score: 35, timeMs: 39, memoryKb: 8192 }),
  buildSubmission({ id: 6, status: "runtime_error", score: 0, timeMs: 12, memoryKb: 4096 }),
  buildSubmission({ id: 7, status: "compile_error", score: 0 }),
  buildSubmission({ id: 8, status: "system_error", score: 0 }),
];
