"use client";

import Link, { type LinkProps } from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/components/providers/i18n-provider";

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, "href"> & Pick<LinkProps, "href">;

export function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const { localize } = useI18n();
  const value = typeof href === "string" ? localize(href) : href;
  return <Link href={value} {...props} />;
}
