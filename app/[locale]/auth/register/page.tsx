import { LocalizedLink } from "@/components/i18n/localized-link";
import { AccountSurface } from "@/features/auth/account-surface";
import { AuthForm } from "@/features/auth/auth-form";
import { getServerTranslator } from "@/lib/i18n/server";

/**
 * 注册页。与登录页同一处修正：右栏那张「默认按权限控制」卡片里
 * 写的是「注册流程与比赛工作区的其他界面保持相同的紧凑字段节奏」——
 * 那是设计说明，不是产品说明；而「返回登录」这个切换入口也被放在卡片末尾。
 * 现在页面只剩表单，切换回到页脚。
 */
export default async function RegisterPage() {
  const t = await getServerTranslator();

  return (
    <AccountSurface eyebrow={t("auth.register.eyebrow")} title={t("auth.register.title")} description={t("auth.register.description")}>
      <div className="mx-auto w-full max-w-md">
        <AuthForm
          mode="register"
          footer={
            <p>
              {t("auth.form.registerFooter")}{" "}
              <LocalizedLink href="/auth/login" className="text-soj-accent underline-offset-4 transition hover:underline">
                {t("auth.form.login")}
              </LocalizedLink>
            </p>
          }
        />
      </div>
    </AccountSurface>
  );
}
