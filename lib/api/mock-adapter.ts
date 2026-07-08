import { notFound } from "./errors";
import { createMockSession } from "@/lib/auth/session";
import { buildScoreboardModel } from "@/lib/domain/scoreboard";
import { mockAcmScoreboardRows, mockContests, mockLanguages, mockOiScoreboardRows, mockProblems, mockSubmissions, mockUser } from "@/lib/mock/fixtures";
import type { ApiClient, CurrentUser, RunSummary, SubmissionSummary } from "./types";

type MockAdapterOptions = {
  currentUser?: CurrentUser;
};

const createdSubmissions: SubmissionSummary[] = [];
const createdRuns: RunSummary[] = [];
let nextSubmissionId = 10_000;
let nextRunId = 20_000;

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
