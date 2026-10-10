import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { UserProfileForm } from "@/features/admin/user-profile-form";
import type { AdminUser } from "@/lib/api/types";

const updateUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/client", () => ({ createBrowserApiClient: () => ({ admin: { updateUser } }) }));
const user: AdminUser = { id: 12, email: "aya@example.com", handle: "aya", bio: "Existing biography", status: "disabled", roles: ["user", "author"], createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" };
function renderForm() {
  const onSaved = vi.fn();
  render(<I18nProvider locale="en"><UserProfileForm user={user} onSaved={onSaved} /></I18nProvider>);
  return onSaved;
}
beforeEach(() => {
  updateUser.mockReset();
  updateUser.mockImplementation(async (_id, input) => ({ ...user, handle: input.username ?? user.handle, bio: input.bio ?? user.bio }));
});

describe("admin profile editor", () => {
  it("loads the profile and sends only changed fields, including an empty bio", async () => {
    const onSaved = renderForm();
    expect(screen.getByLabelText("Bio")).toHaveValue(user.bio);
    expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ bio: "", status: "disabled", roles: ["user", "author"] })));
    expect(updateUser).toHaveBeenCalledWith(12, { bio: "" });
    expect(screen.getByRole("status")).toHaveTextContent("User profile saved.");
  });

  it("trims names and rejects a blank username before calling the API", async () => {
    const onSaved = renderForm();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Username is required.")).toBeVisible();
    expect(updateUser).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: " renamed " } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ handle: "renamed" })));
    expect(updateUser).toHaveBeenCalledWith(12, { username: "renamed" });
  });

  it("keeps the draft after failure so retry can save it", async () => {
    updateUser.mockRejectedValueOnce(new Error("Profile update rejected."));
    const onSaved = renderForm();
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "New biography" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Profile update rejected."));
    expect(screen.getByLabelText("Bio")).toHaveValue("New biography");
    expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ bio: "New biography" })));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
