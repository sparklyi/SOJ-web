"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/errors";
import { createApiClient } from "@/lib/api/client";
import { saveSession } from "@/lib/auth/session";
import { useI18n } from "@/components/providers/i18n-provider";
import type { Translator } from "@/lib/i18n/translate";

type AuthFormProps = {
  mode: "login" | "register";
  /**
   * 表单外壳。
   *
   * `panel` —— 独立页面用：自带面板边框与内边距。
   * `bare` —— 弹窗里用：弹窗本身已经是一块面板，外面再套一层边框就成了盒中盒。
   *
   * 曾经 `panel` 还会在字段上方加一块标题区（「登录 / 使用 SOJ 账户继续」）。
   * 独立页面上的 `PageHeader` 已经把这两行字原样说过一遍，卡片里再说一次
   * 就是同一句话说两遍，所以那块标题区整个撤掉了。
   */
  chrome?: "panel" | "bare";
  /**
   * 表单页脚。登录与注册的互相切换放在这里 —— 它说的是「我点错了，换一个表单」，
   * 属于表单本身，不该寄生在旁边另一张卡片里。
   */
  footer?: ReactNode;
};

type FieldErrors = {
  email?: string;
  username?: string;
  password?: string;
};

export function AuthForm({ mode, chrome = "panel", footer }: AuthFormProps) {
  const router = useRouter();
  const { localize, t } = useI18n();
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
    const nextErrors = validate({ email, username, password }, isRegister, t);

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
      router.push(localize("/me"));
    } catch (error) {
      setApiError(errorMessage(error, t("auth.error.authenticationFailed")));
    } finally {
      setSubmitting(false);
    }
  }

  const bare = chrome === "bare";

  return (
    <form
      className={
        bare
          ? "grid grid-cols-[minmax(0,1fr)] gap-4"
          : "soj-account-panel grid grid-cols-[minmax(0,1fr)] gap-4 p-5"
      }
      onSubmit={submit}
    >
      <Input id={mode + "-email"} name="email" label={t("auth.form.email")} type="email" autoComplete="email" error={errors.email} />
      {isRegister ? <Input id="register-username" name="username" label={t("auth.form.username")} autoComplete="username" error={errors.username} /> : null}
      <Input
        id={mode + "-password"}
        name="password"
        label={t("auth.form.password")}
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        error={errors.password}
      />
      {apiError ? (
        <p className="rounded-soj-md border border-soj-danger/35 bg-soj-danger/10 px-3 py-2 text-sm text-soj-danger" role="alert">
          {apiError}
        </p>
      ) : null}
      {/* 提交用**扁平银**（solid）而不是默认的镀铬 `primary`：
          这份表单出现在两种场合——独立鉴权页与首页弹窗——两种都是
          「一整屏只有一个主操作」的场景，那里立体修饰只会读成旧式拟物。 */}
      <Button type="submit" variant="solid" loading={submitting}>
        {isRegister ? t("auth.form.createAccount") : t("auth.form.login")}
      </Button>
      {footer ? <div className="grid gap-1 border-t border-soj-line/60 pt-4 text-center text-sm text-soj-muted">{footer}</div> : null}
    </form>
  );
}

function validate(input: { email: string; username: string; password: string }, isRegister: boolean, t: Translator): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.email) errors.email = t("auth.validation.emailRequired");
  if (input.email && !input.email.includes("@")) errors.email = t("auth.validation.emailInvalid");
  if (isRegister && !input.username) errors.username = t("auth.validation.usernameRequired");
  if (!input.password) errors.password = t("auth.validation.passwordRequired");
  if (input.password && input.password.length < 8) errors.password = t("auth.validation.passwordMin");
  return errors;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
