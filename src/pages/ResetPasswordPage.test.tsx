import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), updateUser: vi.fn(), resetPasswordForEmail: vi.fn(),
  recovery: true, clearRecovery: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: mocks } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({
  user: { id: "test-user" }, isPasswordRecovery: mocks.recovery,
  clearPasswordRecovery: mocks.clearRecovery, clearMustChangePassword: vi.fn(),
}) }));
vi.mock("@/components/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/Footer", () => ({ Footer: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const open = () => render(<MemoryRouter initialEntries={["/reset-password"]}><ResetPasswordPage /></MemoryRouter>);
describe("password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/reset-password");
    mocks.recovery = true;
    mocks.getUser.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
    mocks.updateUser.mockResolvedValue({ error: null });
  });
  afterEach(cleanup);
  it("opens the form after the recovery hash has already been consumed", async () => {
    open();
    expect(await screen.findByLabelText("New Password *")).toBeInTheDocument();
    expect(screen.queryByLabelText("Current Password *")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("New Password *"), { target: { value: "NewPassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password *"), { target: { value: "NewPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: "NewPassword123" }));
    expect(mocks.clearRecovery).toHaveBeenCalledOnce();
  });
  it("requires the current password for an ordinary signed-in session", async () => {
    mocks.recovery = false;
    open();
    fireEvent.change(await screen.findByLabelText("Current Password *"), { target: { value: "OldPassword123" } });
    fireEvent.change(screen.getByLabelText("New Password *"), { target: { value: "NewPassword123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password *"), { target: { value: "NewPassword123" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({ password: "NewPassword123", current_password: "OldPassword123" }));
  });
  it("offers a fresh link for an expired session rather than spinning forever", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    open();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "parent@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Send new reset link" }));
    await screen.findByRole("status");
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("parent@example.test", { redirectTo: `${window.location.origin}/reset-password` });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("does not trust an expired link even with an existing login", async () => {
    window.history.replaceState({}, "", "/reset-password#error=access_denied&error_code=otp_expired");
    open();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});