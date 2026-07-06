import { notFound } from "./errors";
import { mockContests, mockProblems, mockSubmissions, mockUser } from "@/lib/mock/fixtures";
import type { ApiClient } from "./types";

export function createMockAdapter(): ApiClient {
  return {
    auth: {
      me: async () => mockUser,
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
      list: async () => ({ items: mockSubmissions, total: mockSubmissions.length }),
      get: async (id) => {
        const submission = mockSubmissions.find((item) => item.id === id);
        if (!submission) throw notFound("Submission", id);
        return submission;
      },
    },
    contests: {
      list: async () => ({ items: mockContests, total: mockContests.length }),
      get: async (id) => {
        const contest = mockContests.find((item) => item.id === id);
        if (!contest) throw notFound("Contest", id);
        return contest;
      },
    },
  };
}
