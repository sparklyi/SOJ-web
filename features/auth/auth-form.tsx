"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { createApiClient } from "@/lib/api/client";
import { saveSession } from "@/lib/auth/session";

type AuthFormProps = {
  mode: "login" | "register";
};

type FieldErrors = {
  email?: string;
  username?: string;
  password?: string;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const nextErrors = validate({ email, username, password }, isRegister);

    setErrors(nextErrors);
    setApiError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const client = createApiClient();
      const session = isRegister
        ? await client.auth.register({ email, username, password })
        : await client.auth.login({ email, password });

      saveSession(window.localStorage, session);
      router.push("/me");
    } catch (error) {
      setApiError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="soj-account-panel grid grid-cols-[minmax(0,1fr)] gap-4 p-5" onSubmit={submit}>
      <div className="border-b border-soj-line/60 pb-4">
        <h2 className="text-xl font-semibold text-soj-text">{isRegister ? "Create account" : "Login"}</h2>
        <p className="mt-1 text-sm text-soj-muted">
          {isRegister ? "Create your SOJ identity for problems and contests." : "Use your SOJ account to continue."}
        </p>
      </div>
      <Input id={`${mode}-email`} name="email" label="Email" type="email" autoComplete="email" error={errors.email} />
      {isRegister ? <Input id="register-username" name="username" label="Username" autoComplete="username" error={errors.username} /> : null}
      <Input
        id={`${mode}-password`}
        name="password"
        label="Password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        error={errors.password}
      />
      {apiError ? (
        <p className="rounded-soj-md border border-soj-danger/35 bg-soj-danger/10 px-3 py-2 text-sm text-soj-danger" role="alert">
          {apiError}
        </p>
      ) : null}
      <Button type="submit" loading={submitting}>
        {isRegister ? "Create account" : "Login"}
      </Button>
    </form>
  );
}

function validate(input: { email: string; username: string; password: string }, isRegister: boolean): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email) errors.email = "Email is required.";
  if (input.email && !input.email.includes("@")) errors.email = "Enter a valid email address.";
  if (isRegister && !input.username) errors.username = "Username is required.";
  if (!input.password) errors.password = "Password is required.";
  return errors;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Authentication failed.";
}
