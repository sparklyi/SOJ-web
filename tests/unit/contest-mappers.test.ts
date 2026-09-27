import { describe, expect, it } from "vitest";
import type { ContestResponse } from "@/lib/api/backend-types";
import { mapAdminContest, mapContestResponse } from "@/lib/api/contest-mappers";

/**
 * Go 的 nil slice 序列化成 null：一场没有题目的比赛拿到的是 `problems: null`。
 * 两个映射器都必须容忍它——展开 null 曾在真实后端下把后台竞赛页打崩。
 */
function contestResponse(overrides: Partial<ContestResponse> = {}): ContestResponse {
  return {
    id: 1,
    owner_user_id: 1,
    title: "Demo Contest",
    visibility: "public",
    status: "draft",
    registered: false,
    current_user_roles: [],
    start_at: "2030-01-01T10:00:00Z",
    end_at: "2030-01-01T12:00:00Z",
    freeze_at: "2030-01-01T11:00:00Z",
    problems: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("contest mappers tolerate a null problem list", () => {
  it("maps an admin contest without problems", () => {
    expect(mapAdminContest(contestResponse()).problems).toEqual([]);
  });

  it("maps a contest summary without problems", () => {
    expect(mapContestResponse(contestResponse()).problems).toEqual([]);
  });
});
