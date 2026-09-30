import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/components/providers/app-providers";
import { ManageOverview } from "@/features/manage/console/manage-overview";
import type { CurrentUser } from "@/lib/api/types";
import { createMockSession, saveSession } from "@/lib/auth/session";
import { mockAdminUser, mockAuthorUser, mockOperatorUser, mockReviewerUser, mockUser } from "@/lib/mock/fixtures";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/manage",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderOverview(user?: CurrentUser) {
  if (user) saveSession(window.localStorage, createMockSession(user));
  return render(
    <AppProviders>
      <ManageOverview />
    </AppProviders>,
  );
}

describe("manage overview", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("shows only the authoring card to an author", async () => {
    renderOverview(mockAuthorUser);

    const card = await screen.findByRole("link", { name: /Authoring/ });
    expect(card.getAttribute("href")).toContain("/manage/problems");
    expect(screen.queryByRole("link", { name: /Review/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Rejudge/ })).not.toBeInTheDocument();
  });

  it("shows the authoring and review cards to a reviewer", async () => {
    // Reviewers hold problem.review, which opens the authoring console too
    // (CanAccessAuthoring); rejudge stays hidden.
    renderOverview(mockReviewerUser);

    const reviewCard = await screen.findByRole("link", { name: /Review/ });
    expect(reviewCard.getAttribute("href")).toContain("/manage/reviews");
    expect(screen.getByRole("link", { name: /Authoring/ })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Rejudge/ })).not.toBeInTheDocument();
  });

  it("shows only the rejudge card to an operator", async () => {
    renderOverview(mockOperatorUser);

    const card = await screen.findByRole("link", { name: /Rejudge/ });
    expect(card.getAttribute("href")).toContain("/manage/rejudge");
    expect(screen.queryByRole("link", { name: /Authoring/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Review/ })).not.toBeInTheDocument();
  });

  it("shows every card to a full-access account", async () => {
    renderOverview(mockAdminUser);

    await waitFor(() => expect(screen.getByRole("link", { name: /Authoring/ })).toBeVisible());
    expect(screen.getByRole("link", { name: /Review/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Rejudge/ })).toBeVisible();
  });

  it("shows the shared denied state to a plain account", async () => {
    renderOverview(mockUser);

    await waitFor(() => expect(screen.getByText("403 · Permission required")).toBeVisible());
    expect(screen.queryByRole("link", { name: /Authoring/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Review/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Rejudge/ })).not.toBeInTheDocument();
  });
});
