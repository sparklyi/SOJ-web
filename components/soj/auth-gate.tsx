import type { CurrentUser } from "@/lib/api/types";

type AuthGateProps = {
  user: CurrentUser | null;
  fallback: React.ReactNode;
  children: React.ReactNode;
};

export function AuthGate({ user, fallback, children }: AuthGateProps) {
  return user ? children : fallback;
}
