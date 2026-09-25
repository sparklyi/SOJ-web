import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { RunResultView } from "@/features/runs/run-result-view";
import type { RunState } from "@/features/runs/use-run";
import type { RunSummary } from "@/lib/api/types";

function runFixture(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id: 5,
    languageId: 71,
    status: "accepted",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderState(state: RunState, onContinuePolling?: () => void) {
  return render(
    <I18nProvider locale="en">
      <RunResultView state={state} onContinuePolling={onContinuePolling} />
    </I18nProvider>,
  );
}

describe("RunResultView", () => {
  it("renders nothing before a run starts", () => {
    const { container } = renderState({ status: "idle" });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the program output and cost for a finished run", () => {
    renderState({ status: "success", run: runFixture({ stdout: "42\n", timeMs: 12, memoryKb: 3_400 }) });

    expect(screen.getByText("Finished")).toBeVisible();
    expect(screen.getByText("42")).toBeVisible();
    expect(screen.getByText(/Time/)).toBeVisible();
    expect(screen.getByText(/Memory/)).toBeVisible();
  });

  it("renders compiler output for a compile error without calling it a failure", () => {
    renderState({ status: "success", run: runFixture({ status: "compile_error", compileOutput: "error: expected ';'" }) });

    // 关键区分：HTTP 请求成功了，只是编译没过。把它显示成「运行失败」
    // 会把编译器的原话藏起来，用户就无从修起。
    expect(screen.getByText("Compiler output")).toBeVisible();
    expect(screen.getByText(/expected ';'/)).toBeVisible();
    expect(screen.queryByText(/Run failed/i)).toBeNull();
  });

  it("renders stderr for a runtime error", () => {
    renderState({ status: "success", run: runFixture({ status: "runtime_error", stderr: "panic: boom" }) });

    expect(screen.getByText("Error output")).toBeVisible();
    expect(screen.getByText(/panic: boom/)).toBeVisible();
  });

  it("does not repeat an error that is already in the output block", () => {
    // 后端把同一份编译器 stderr 同时放进 compileOutput 与 errorMessage。
    const compileError = "# command-line-arguments\n./main.go:11:19: invalid operation";
    const { container } = renderState({
      status: "success",
      run: runFixture({ status: "compile_error", compileOutput: compileError, errorMessage: compileError }),
    });

    expect(screen.getByText("Compiler output")).toBeVisible();
    // 已经逐字显示过，就不该再有一条红字重复。
    expect(container.querySelectorAll("p.text-soj-danger")).toHaveLength(0);
  });

  it("still shows a short error that has no output block", () => {
    const { container } = renderState({
      status: "success",
      run: runFixture({ status: "output_limit", errorMessage: "output limit exceeded" }),
    });

    // 「输出超限」没有对应的输出块，这条必须单独显示，否则用户看不到原因。
    expect(container.querySelectorAll("p.text-soj-danger")).toHaveLength(1);
    expect(screen.getByText("output limit exceeded")).toBeVisible();
  });

  it("treats a request failure as an error message", () => {
    renderState({ status: "error", message: "too many runs in flight" });

    expect(screen.getByText("too many runs in flight")).toBeVisible();
  });

  it("explains a run that outlived the wait window and offers to check again", () => {
    const onContinuePolling = vi.fn();
    renderState({ status: "stillRunning", run: runFixture({ status: "running" }), elapsedMs: 31_000 }, onContinuePolling);

    // 只断言状态标签本身：/still running/i 也会命中下面那句解释。
    expect(screen.getByText(/still running \(/i)).toBeVisible();
    expect(screen.getByText("Still running on the judge. Check again.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Check again" }));
    expect(onContinuePolling).toHaveBeenCalledTimes(1);
  });

  it("omits the check-again button when the caller has nothing to poll with", () => {
    renderState({ status: "stillRunning", run: runFixture({ status: "running" }), elapsedMs: 31_000 });

    expect(screen.queryByRole("button", { name: "Check again" })).toBeNull();
  });
});
