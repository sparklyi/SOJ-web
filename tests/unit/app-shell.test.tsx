import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageShell } from "@/components/layout/page-shell";
import { SplitWorkspace } from "@/components/layout/split-workspace";

describe("app shell", () => {
  it("renders one primary navigation, user menu, and main landmark", () => {
    render(
      <PageShell title="Problems" description="Browse training problems.">
        <section>Problem content</section>
      </PageShell>,
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeVisible();
    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("link", { name: "Problems" })).toHaveAttribute("href", "/problems");
    expect(screen.getByRole("link", { name: "Contests" })).toHaveAttribute("href", "/contests");
    expect(screen.getByRole("link", { name: "Submissions" })).toHaveAttribute("href", "/submissions");
    expect(screen.getByRole("button", { name: "Open user menu" })).toBeVisible();
  });

  it("renders split workspace regions", () => {
    render(<SplitWorkspace primary={<div>Statement</div>} secondary={<div>Judge feedback</div>} />);

    expect(screen.getByText("Statement")).toBeVisible();
    expect(screen.getByText("Judge feedback")).toBeVisible();
  });
});
