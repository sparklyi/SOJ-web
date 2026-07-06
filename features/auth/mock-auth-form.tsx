"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MockAuthFormProps = {
  mode: "login" | "register";
};

export function MockAuthForm({ mode }: MockAuthFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isRegister = mode === "register";

  return (
    <form
      className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-soj-lg border border-soj-line bg-soj-bg-raised p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const handle = String(data.get("handle") ?? "").trim();
        const password = String(data.get("password") ?? "").trim();
        const email = String(data.get("email") ?? "").trim();

        if (!handle || !password || (isRegister && !email)) {
          setSubmitted(false);
          setError("Complete the required fields to continue in mock mode.");
          return;
        }

        setError(undefined);
        setSubmitted(true);
      }}
    >
      <Input id={`${mode}-handle`} name="handle" label="Handle" autoComplete="username" helperText="Use any contest handle in mock mode." />
      {isRegister ? <Input id="register-email" name="email" label="Email" type="email" autoComplete="email" helperText="Used for account recovery later." /> : null}
      <Input id={`${mode}-password`} name="password" label="Password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} helperText="Mock mode does not send credentials." />
      {error ? <p className="text-sm text-soj-danger">{error}</p> : null}
      {submitted ? <p className="text-sm text-soj-success">Mock session ready.</p> : null}
      <Button type="submit">{isRegister ? "Create account" : "Enter session"}</Button>
    </form>
  );
}
