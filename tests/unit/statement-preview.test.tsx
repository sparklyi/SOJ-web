import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { StatementStep } from "@/features/problems/authoring/steps/statement-step";

function renderEditor(onSave = vi.fn()) {
  render(<I18nProvider locale="en"><StatementStep busy={false} onSave={onSave} /></I18nProvider>);
  return { preview: screen.getByRole("complementary", { name: "Live preview" }), onSave };
}

describe("statement live preview", () => {
  it("updates unsaved prose and formulas, while keeping samples literal", async () => {
    const { preview, onSave } = renderEditor();
    expect(within(preview).getAllByText("Enter content to see its preview.")).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Description", { exact: true }), { target: { value: "For $n < 10$ return **the sum**." } });
    fireEvent.change(screen.getByLabelText("Input description"), { target: { value: "One integer $n$." } });
    fireEvent.change(screen.getByLabelText("Output description"), { target: { value: "Print $n + 1$." } });
    fireEvent.change(screen.getByLabelText("Sample 1 input"), { target: { value: "$n$\n<img src=x>" } });
    fireEvent.change(screen.getByLabelText("Sample 1 output"), { target: { value: "**literal**" } });
    fireEvent.change(screen.getByLabelText("Sample 1 explanation"), { target: { value: "Because $1 + 1 = 2$." } });
    fireEvent.change(screen.getByLabelText("Hint"), { target: { value: "Use $O(n)$." } });
    await waitFor(() => expect(preview.querySelectorAll(".katex")).toHaveLength(5));
    expect(within(preview).getByText("the sum").tagName).toBe("STRONG");
    expect(preview.querySelector("pre")?.textContent).toBe("$n$\n<img src=x>");
    expect(preview.querySelector("img")).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("clears a formula error after correction and saves the unchanged draft", async () => {
    const { preview, onSave } = renderEditor();
    const source = "$\\frac{1}{$";
    fireEvent.change(screen.getByLabelText("Description", { exact: true }), { target: { value: source } });
    await waitFor(() => expect(within(preview).getByText(/Formula error:/)).toBeInTheDocument());
    // Preview validation is advisory and never rewrites or prevents saving source text.
    fireEvent.submit(screen.getByRole("button", { name: "Save statement" }).closest("form")!);
    expect(onSave).toHaveBeenCalledWith({ description: source, inputDescription: "", outputDescription: "", samples: [], hint: "", source: "" });
    fireEvent.change(screen.getByLabelText("Description", { exact: true }), { target: { value: "$\\frac{1}{2}$" } });
    await waitFor(() => expect(within(preview).queryByText(/Formula error:/)).not.toBeInTheDocument());
    expect(preview.querySelector(".katex")).not.toBeNull();
  });

  it("keeps the preview sample list in sync and preserves incomplete-sample validation", async () => {
    const { preview, onSave } = renderEditor();
    fireEvent.change(screen.getByLabelText("Description", { exact: true }), { target: { value: "Return a value." } });
    fireEvent.click(screen.getByRole("button", { name: "Add sample" }));
    await waitFor(() => expect(within(preview).getByRole("heading", { name: "Sample 2" })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Sample 2 input"), { target: { value: "2" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save statement" }).closest("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent("Each sample needs both input and output.");
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Remove sample" })[1]);
    await waitFor(() => expect(within(preview).queryByRole("heading", { name: "Sample 2" })).not.toBeInTheDocument());
  });

  it("localizes the preview and error label in Chinese", async () => {
    render(<I18nProvider locale="zh-CN"><StatementStep busy={false} onSave={vi.fn()} /></I18nProvider>);
    const preview = screen.getByRole("complementary", { name: "实时预览" });
    fireEvent.change(screen.getByLabelText("描述", { exact: true }), { target: { value: "$\\unknowncommand$" } });
    await waitFor(() => expect(within(preview).getByText(/公式错误:/)).toBeInTheDocument());
  });
});
