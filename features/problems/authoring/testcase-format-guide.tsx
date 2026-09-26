"use client";

import { Download } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";

/** 模板是仓库静态资源，不能走 LocalizedLink（locale 前缀会指向不存在的路径）。 */
export const TESTCASE_TEMPLATE_HREF = "/examples/testcases.zip";

export function TestcaseFormatGuide() {
  const { t } = useI18n();

  return (
    <section className="soj-account-panel grid gap-4 p-5" aria-label={t("authoring.testcase.formatTitle")}>
      <div className="border-b border-soj-line/55 pb-4">
        <p className="font-mono text-xs uppercase text-soj-muted">{t("authoring.step.testcase")}</p>
        <h3 className="mt-2 text-lg font-semibold text-soj-text">{t("authoring.testcase.formatTitle")}</h3>
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-soj-muted">
        <li>{t("authoring.format.pairing")}</li>
        <li>{t("authoring.format.structure")}</li>
        <li>{t("authoring.format.limits")}</li>
        <li>{t("authoring.format.noSamples")}</li>
      </ul>
      <a className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit")} href={TESTCASE_TEMPLATE_HREF} download>
        <Download aria-hidden className="h-3.5 w-3.5" />
        {t("authoring.downloadTemplate")}
      </a>
    </section>
  );
}
