import { PageShell } from "@/components/layout/page-shell";
import { PageHeader } from "@/components/ui/page-header";
import { getServerTranslator } from "@/lib/i18n/server";
import { PlaygroundClient } from "@/features/playground/playground-client";

/**
 * 练习场。
 *
 * 与题目详情、比赛详情不同，这里**不套 `SessionGate`**：练习场是「入口」
 * 而不是「内容详情」，访客可以打开、可以在编辑器里写代码，草稿存在本地；
 * 只有「运行」需要登录，那一步在客户端判断（见 `PlaygroundClient`）。
 *
 * 页面本身没有服务端取数：语言目录是公开接口，客户端拿即可，
 * 这样匿名访客也能看到真实的语言列表。
 */
export default async function PlaygroundPage() {
  const t = await getServerTranslator();

  return (
    <PageShell>
      <PageHeader
        eyebrow={t("playground.eyebrow")}
        title={t("playground.title")}
        description={t("playground.description")}
        className="mb-6"
      />
      <PlaygroundClient />
    </PageShell>
  );
}
