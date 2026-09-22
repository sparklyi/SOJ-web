import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { useRun } from "@/features/runs/use-run";
import type { RunSummary } from "@/lib/api/types";

const runsCreate = vi.fn();
const runsGet = vi.fn();

vi.mock("@/lib/api/client", () => ({
  createBrowserApiClient: () => ({ runs: { create: runsCreate, get: runsGet } }),
}));

function runFixture(overrides: Partial<RunSummary>): RunSummary {
  return {
    id: 1,
    languageId: 71,
    status: "queued",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderWithLocale(ui: ReactNode) {
  return render(<I18nProvider locale="en">{ui}</I18nProvider>);
}

/**
 * 轮询窗口按毫秒给，测试里用真实计时器跑几毫秒即可——
 * 换成假计时器会把 await 链和计时器推进搅在一起，反而更难写对。
 */
function Harness({ deadlineMs }: { deadlineMs: number }) {
  const { state, run, continuePolling } = useRun({ pollIntervalMs: 5, deadlineMs });

  return (
    <div>
      <p data-testid="status">{state.status}</p>
      <p data-testid="stdout">{state.status === "success" || state.status === "stillRunning" ? (state.run.stdout ?? "") : ""}</p>
      <button type="button" onClick={() => void run({ languageId: 71, sourceCode: "code", stdin: "7\n" })}>
        go
      </button>
      <button type="button" onClick={() => void continuePolling()}>
        more
      </button>
    </div>
  );
}

describe("useRun", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("polls until the run reaches a terminal status", async () => {
    runsCreate.mockResolvedValue(runFixture({ id: 5, status: "queued" }));
    runsGet
      .mockResolvedValueOnce(runFixture({ id: 5, status: "running" }))
      .mockResolvedValueOnce(runFixture({ id: 5, status: "accepted", stdout: "7\n" }));

    renderWithLocale(<Harness deadlineMs={2_000} />);
    fireEvent.click(screen.getByRole("button", { name: "go" }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("success"));
    expect(screen.getByTestId("stdout")).toHaveTextContent("7");
    expect(runsCreate).toHaveBeenCalledWith({ languageId: 71, sourceCode: "code", stdin: "7\n" });
  });

  it("stops at the deadline with a stillRunning state rather than a spinner or an error", async () => {
    runsCreate.mockResolvedValue(runFixture({ id: 5, status: "running" }));
    runsGet.mockResolvedValue(runFixture({ id: 5, status: "running" }));

    renderWithLocale(<Harness deadlineMs={20} />);
    fireEvent.click(screen.getByRole("button", { name: "go" }));

    // 「没等到」不是「失败」，也不是「还在转」：界面必须能把它说清楚。
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("stillRunning"), { timeout: 1_000 });
  });

  it("resumes polling from a stillRunning run when asked to check again", async () => {
    runsCreate.mockResolvedValue(runFixture({ id: 5, status: "running" }));
    runsGet.mockResolvedValue(runFixture({ id: 5, status: "running" }));

    renderWithLocale(<Harness deadlineMs={20} />);
    fireEvent.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("stillRunning"), { timeout: 1_000 });

    runsGet.mockResolvedValue(runFixture({ id: 5, status: "accepted", stdout: "late\n" }));
    fireEvent.click(screen.getByRole("button", { name: "more" }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("success"));
    expect(screen.getByTestId("stdout")).toHaveTextContent("late");
  });

  it("reports a request failure as an error, not as a verdict", async () => {
    runsCreate.mockRejectedValue(new Error("run.user_limit_exceeded"));

    renderWithLocale(<Harness deadlineMs={20} />);
    fireEvent.click(screen.getByRole("button", { name: "go" }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
  });

  it("treats a compile error as a finished run, not a failed request", async () => {
    runsCreate.mockResolvedValue(runFixture({ id: 5, status: "compile_error", compileOutput: "error: bad" }));

    renderWithLocale(<Harness deadlineMs={2_000} />);
    fireEvent.click(screen.getByRole("button", { name: "go" }));

    // HTTP 200 + compile_error 是正常结果。这条界线一旦写错，
    // 编译失败会被显示成「运行失败」，用户就看不到编译器说了什么。
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("success"));
  });

  it("does not poll when the created run is already terminal", async () => {
    runsCreate.mockResolvedValue(runFixture({ id: 5, status: "accepted", stdout: "ok\n" }));

    renderWithLocale(<Harness deadlineMs={2_000} />);
    fireEvent.click(screen.getByRole("button", { name: "go" }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("success"));
    expect(runsGet).not.toHaveBeenCalled();
  });
});
