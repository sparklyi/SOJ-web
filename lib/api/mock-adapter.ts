import { notFound } from "./errors";
import { createMockSession } from "@/lib/auth/session";
import { buildScoreboardModel } from "@/lib/domain/scoreboard";
import { mockAcmScoreboardRows, mockContests, mockLanguages, mockOiScoreboardRows, mockProblems, mockSubmissions, mockUser } from "@/lib/mock/fixtures";
import type { ApiClient, AuthoringProblem, AuthoringStatement, AuthoringTestcaseSet, CurrentUser, ProblemCheckRun, RunSummary, SubmissionSummary } from "./types";

type MockAdapterOptions = {
  currentUser?: CurrentUser;
};

const createdSubmissions: SubmissionSummary[] = [];
const createdRuns: RunSummary[] = [];
let nextSubmissionId = 10_000;
let nextRunId = 20_000;
let nextProblemId = 30_000;
let nextTestcaseSetId = 40_000;
let nextCheckId = 50_000;
const authoredProblems: AuthoringProblem[] = mockProblems.slice(0, 3).map((problem) => ({
  id: problem.id,
  title: problem.title,
  slug: problem.slug,
  difficulty: problem.difficulty,
  visibility: "public",
  publicationStatus: "published",
  tags: problem.tags,
  timeLimitMs: problem.timeLimitMs,
  memoryLimitKb: problem.memoryLimitKb,
  ownerUserId: mockUser.id,
}));
const authoringStatements = new Map<number, AuthoringStatement>();
const authoringTestcaseSets = new Map<number, AuthoringTestcaseSet>();
const authoringChecks = new Map<number, ProblemCheckRun>();

for (const problem of authoredProblems) {
  const statement: AuthoringStatement = {
    problemId: problem.id,
    version: 1,
    title: problem.title,
    description: `Solve ${problem.title}.`,
    inputDescription: "Input data.",
    outputDescription: "Expected output.",
    samples: [{ input: "1", output: "1" }],
    hint: "",
    source: "SOJ",
  };
  const testcaseSet: AuthoringTestcaseSet = {
    id: nextTestcaseSetId++,
    problemId: problem.id,
    version: 1,
    checksumSha256: "mock-checksum",
    sizeBytes: 1024,
    caseCount: 1,
    status: "ready",
    isCurrent: true,
  };
  const check: ProblemCheckRun = {
    id: nextCheckId++,
    problemId: problem.id,
    testcaseSetId: testcaseSet.id,
    status: "completed",
    summary: { caseCount: 1, expectedCaseCount: 1, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: true },
    findings: [],
  };
  authoringStatements.set(problem.id, statement);
  authoringTestcaseSets.set(problem.id, testcaseSet);
  authoringChecks.set(problem.id, check);
}

function mockAuthUser(input: { email: string; username?: string }): CurrentUser {
  const handle = input.username ?? input.email.split("@")[0] ?? mockUser.handle;
  return {
    ...mockUser,
    handle,
    displayName: handle,
  };
}

export function createMockAdapter(options: MockAdapterOptions = {}): ApiClient {
  const currentUser = options.currentUser ?? mockUser;

  return {
    auth: {
      login: async (input) => createMockSession(mockAuthUser(input)),
      register: async (input) => createMockSession(mockAuthUser(input)),
      refresh: async () => createMockSession(currentUser),
      logout: async () => undefined,
      me: async () => currentUser,
    },
    problems: {
      list: async () => ({ items: mockProblems, total: mockProblems.length }),
      get: async (id) => {
        const problem = mockProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        return problem;
      },
      listMine: async () => ({ items: authoredProblems.filter((problem) => problem.ownerUserId === currentUser.id), total: authoredProblems.filter((problem) => problem.ownerUserId === currentUser.id).length }),
      create: async (input) => {
        const problem: AuthoringProblem = { ...input, id: nextProblemId++, publicationStatus: "draft", ownerUserId: currentUser.id };
        authoredProblems.unshift(problem);
        return problem;
      },
      update: async (id, input) => {
        const index = authoredProblems.findIndex((problem) => problem.id === id);
        if (index < 0) throw notFound("Problem", id);
        authoredProblems[index] = { ...authoredProblems[index], ...input };
        return authoredProblems[index];
      },
      saveStatement: async (id, input) => {
        const statement: AuthoringStatement = { ...input, problemId: id, version: (authoringStatements.get(id)?.version ?? 0) + 1 };
        authoringStatements.set(id, statement);
        authoringChecks.delete(id);
        demoteAuthoredProblem(id);
        return statement;
      },
      uploadTestcases: async (id, input) => {
        const testcaseSet: AuthoringTestcaseSet = {
          id: nextTestcaseSetId++,
          problemId: id,
          version: (authoringTestcaseSets.get(id)?.version ?? 0) + 1,
          checksumSha256: "mock-checksum",
          sizeBytes: input.archive.size,
          caseCount: input.caseCount,
          status: "ready",
          isCurrent: true,
        };
        authoringTestcaseSets.set(id, testcaseSet);
        authoringChecks.delete(id);
        demoteAuthoredProblem(id);
        return testcaseSet;
      },
      getAuthoringState: async (id) => {
        const problem = authoredProblems.find((item) => item.id === id);
        if (!problem) throw notFound("Problem", id);
        const statement = authoringStatements.get(id);
        const testcaseSet = authoringTestcaseSets.get(id);
        const latestCheck = authoringChecks.get(id);
        const blockers = [
          ...(!statement ? [{ code: "problem.statement_required", message: "Current statement is required." }] : []),
          ...(!testcaseSet ? [{ code: "problem.testcase_required", message: "Current testcase set is required." }] : []),
          ...(testcaseSet && !latestCheck ? [{ code: "problem.check_required", message: "Run a problem check." }] : []),
        ];
        return { problem, statement, testcaseSet, latestCheck, publishable: blockers.length === 0 && Boolean(latestCheck?.summary.valid), blockers };
      },
      runCheck: async (id) => {
        const testcaseSet = authoringTestcaseSets.get(id);
        if (!testcaseSet) throw notFound("Testcase set", id);
        const check: ProblemCheckRun = {
          id: nextCheckId++,
          problemId: id,
          testcaseSetId: testcaseSet.id,
          status: "completed",
          summary: { caseCount: testcaseSet.caseCount, expectedCaseCount: testcaseSet.caseCount, findingCount: 0, errorCount: 0, warningCount: 0, infoCount: 0, storageReadable: true, zipReadable: true, valid: true },
          findings: [],
        };
        authoringChecks.set(id, check);
        return check;
      },
      publish: async (id) => {
        const state = await createMockAdapter(options).problems.getAuthoringState(id);
        if (!state.publishable) throw new Error(state.blockers[0]?.message ?? "Problem is not publishable.");
        const index = authoredProblems.findIndex((problem) => problem.id === id);
        authoredProblems[index] = { ...authoredProblems[index], publicationStatus: "published" };
        return authoredProblems[index];
      },
    },
    submissions: {
      list: async () => {
        const items = [...createdSubmissions, ...mockSubmissions];
        return { items, total: items.length };
      },
      get: async (id) => {
        const submission = [...createdSubmissions, ...mockSubmissions].find((item) => item.id === id);
        if (!submission) throw notFound("Submission", id);
        return submission;
      },
      create: async (input) => {
        const problem = mockProblems.find((item) => item.id === input.problemId);
        const submission: SubmissionSummary = {
          id: nextSubmissionId++,
          problemId: input.problemId,
          problemTitle: problem?.title ?? `Problem #${input.problemId}`,
          contestId: input.contestId,
          status: "queued",
          score: 0,
          submittedAt: new Date().toISOString(),
        };
        createdSubmissions.unshift(submission);
        return submission;
      },
    },
    runs: {
      create: async (input) => {
        const run: RunSummary = {
          id: nextRunId++,
          problemId: input.problemId,
          languageId: input.languageId,
          status: "queued",
          stdout: "",
          stderr: "",
          compileOutput: undefined,
          errorMessage: undefined,
          createdAt: new Date().toISOString(),
        };
        createdRuns.unshift(run);
        return run;
      },
      get: async (id) => {
        const run = createdRuns.find((item) => item.id === id);
        if (!run) throw notFound("Run", id);
        return run;
      },
    },
    contests: {
      list: async () => ({ items: mockContests, total: mockContests.length }),
      get: async (id) => {
        const contest = mockContests.find((item) => item.id === id);
        if (!contest) throw notFound("Contest", id);
        return contest;
      },
      register: async (id, input) => ({
        id,
        contestId: id,
        userId: currentUser.id,
        displayName: input.displayName,
        email: input.email,
        status: "active",
        registeredAt: new Date().toISOString(),
      }),
      scoreboard: async (id) => {
        const contest = mockContests.find((item) => item.id === id);
        if (!contest) throw notFound("Contest", id);

        return contest.type === "acm"
          ? buildScoreboardModel({ type: "acm", rows: mockAcmScoreboardRows })
          : buildScoreboardModel({ type: "oi", rows: mockOiScoreboardRows });
      },
    },
    languages: {
      list: async (filter = {}) => {
        const items = mockLanguages.filter((language) => {
          if (typeof filter.enabled === "boolean" && language.enabled !== filter.enabled) return false;
          if (filter.engine && language.engine !== filter.engine) return false;
          return true;
        });
        return { items, total: items.length };
      },
    },
  };
}

function demoteAuthoredProblem(id: number) {
  const index = authoredProblems.findIndex((problem) => problem.id === id);
  if (index >= 0 && authoredProblems[index].publicationStatus === "published") {
    authoredProblems[index] = { ...authoredProblems[index], publicationStatus: "draft" };
  }
}
