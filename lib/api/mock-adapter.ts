import { notFound } from "./errors";
import { createMockSession } from "@/lib/auth/session";
import { mockContests, mockLanguages, mockProblems, mockSubmissions, mockUser } from "@/lib/mock/fixtures";
import type { ApiClient, CurrentUser } from "./types";

type MockAdapterOptions = {
  currentUser?: CurrentUser;
};

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
