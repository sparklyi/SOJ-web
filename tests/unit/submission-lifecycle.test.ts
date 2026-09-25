import { describe, expect, it } from "vitest";
import type { JudgeStatus } from "@/lib/api/types";
import { buildSubmissionTimeline, getSubmissionDisplayState, isSubmissionTerminal, verdictLabel } from "@/lib/domain/submission";
import { buildSubmission } from "@/lib/mock/builders";

const statuses: JudgeStatus[] = [
  "queued",
  "compiling",
  "running",
  "accepted",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "time_limit",
  "memory_limit",
  "output_limit",
  "canceled",
  "system_error",
];

describe("submission lifecycle", () => {
  it("maps every judge status to its universal verdict label", () => {
    expect(statuses.map(verdictLabel)).toEqual([
      "Queued",
      "Compiling",
      "Running",
      "Accepted",
      "Wrong Answer",
      "Compile Error",
      "Runtime Error",
      "Time Limit Exceeded",
      "Memory Limit Exceeded",
      "Output Limit Exceeded",
      "Canceled",
      "System Error",
    ]);
  });

  it("treats an unknown verdict as terminal instead of crashing", () => {
    // 后端曾先于前端新增 output_limit，未识别的状态让页面在 `undefined.terminal` 上白屏。
    // 这里锁住兵底：未知值当终态停下轮询，并原样透出而不是译成空。
    const unknown = "some_future_status" as JudgeStatus;
    expect(isSubmissionTerminal(unknown)).toBe(true);
    expect(verdictLabel(unknown)).toBe("some_future_status");
    expect(getSubmissionDisplayState(unknown).tone).toBe("danger");
  });

  it("marks only final verdicts as terminal", () => {
    expect(isSubmissionTerminal("queued")).toBe(false);
    expect(isSubmissionTerminal("running")).toBe(false);
    expect(isSubmissionTerminal("accepted")).toBe(true);
    expect(isSubmissionTerminal("time_limit")).toBe(true);
    expect(isSubmissionTerminal("memory_limit")).toBe(true);
    expect(isSubmissionTerminal("canceled")).toBe(true);
    expect(isSubmissionTerminal("system_error")).toBe(true);
  });

  it("builds lifecycle timeline up to the current status", () => {
    const running = buildSubmission({ status: "running" });
    const accepted = buildSubmission({ status: "accepted" });

    expect(buildSubmissionTimeline(running).map((state) => state.status)).toEqual(["queued", "compiling", "running"]);
    expect(buildSubmissionTimeline(accepted).map((state) => state.status)).toEqual(["queued", "compiling", "running", "accepted"]);
  });
});
