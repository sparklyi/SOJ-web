import { LocalizedLink } from "@/components/i18n/localized-link";
import { AccountSurface } from "@/features/auth/account-surface";
import { AuthForm } from "@/features/auth/auth-form";
import { getServerTranslator } from "@/lib/i18n/server";

/**
 * 登录页。
 *
 * 此前它有两栏：左边表单，右边一张「会话状态」卡片，写着
 * 「SOJ 会在比赛、题目和账户界面之间保持一致的访问状态。」——那句话不说任何事，
 * 而「创建账户」这个**切换入口**被放在那张卡片的末尾，跑出了表单。
 * 上面还有一块仪表盘式的摘要（「会话路径 / 比赛已就绪 / 认证 SOJ / 访问 网页」），
 * 其中「访问：网页」对一个网页产品毫无信息量。
 *
 * 现在它就是一件事：一个居中的表单，切换在页脚。
 */
export default async function LoginPage() {
  const t = await getServerTranslator();

  return (
    <AccountSurface eyebrow={t("auth.login.eyebrow")} title={t("auth.login.title")} description={t("auth.login.description")}>
      <div className="mx-auto w-full max-w-md">
        <AuthForm
          mode="login"
          footer={
            <p>
              {t("auth.form.loginFooter")}{" "}
              <LocalizedLink href="/auth/register" className="text-soj-accent transition hover:opacity-80">
                {t("auth.form.createAccount")}
              </LocalizedLink>
            </p>
          }
        />
      </div>
    </AccountSurface>
  );
}
