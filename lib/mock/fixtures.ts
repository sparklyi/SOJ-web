import type { ContestSummary, CurrentUser, JudgeLanguage, ProblemDetail, SubmissionSummary } from "@/lib/api/types";
import { buildAcmScoreboardRow, buildContest, buildOiScoreboardRow, buildProblem, buildSubmission } from "./builders";

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

export const mockLanguages: JudgeLanguage[] = [
  {
    id: 54,
    engine: "soj-agent",
    engineLanguageId: "cpp17",
    name: "C++17",
    version: "17",
    compileCommand: "g++ -std=c++17 -O2 -pipe -o {{binary}} {{source}}",
    runCommand: "{{binary}}",
    defaultTimeLimitMs: 1000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
  {
    id: 60,
    engine: "soj-agent",
    engineLanguageId: "go",
    name: "Go",
    version: "1.24",
    compileCommand: "go build -o {{binary}} {{source}}",
    runCommand: "{{binary}}",
    defaultTimeLimitMs: 1000,
    defaultMemoryLimitKb: 262144,
    enabled: true,
  },
];

export const mockAcmScoreboardRows = [
  buildAcmScoreboardRow({ id: "team-1", handle: "lin-chen", solved: 5, penalty: 312, movement: 2 }),
  buildAcmScoreboardRow({ id: "team-2", handle: "mira", solved: 4, penalty: 260, movement: -1 }),
  buildAcmScoreboardRow({ id: "team-3", handle: "ravi", solved: 4, penalty: 344, movement: 0 }),
];

export const mockOiScoreboardRows = [
  buildOiScoreboardRow({ id: "team-1", handle: "lin-chen", score: 460, lastImprovedAt: "2026-07-07T10:35:00Z", movement: 2 }),
  buildOiScoreboardRow({ id: "team-2", handle: "mira", score: 420, lastImprovedAt: "2026-07-07T10:41:00Z", movement: 1 }),
  buildOiScoreboardRow({ id: "team-3", handle: "ravi", score: 420, lastImprovedAt: "2026-07-07T10:22:00Z", movement: -2 }),
];
