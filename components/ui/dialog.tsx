"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/ui/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: DialogPrimitive.DialogContentProps) {
  const { t } = useI18n();

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-soj-bg/85 backdrop-blur-md" />
      {/*
        面板外观（底色 / 描边 / 阴影 / 圆角）整体归 `.soj-sheet` 一个类，
        定位与尺寸才走工具类——两类样式各管各的属性，不存在谁覆盖谁。
        **内边距不在基础件里定**：弹窗纵向节奏取决于内容（有的只有一句话，
        有的是一整张表单），所以由使用方给，基础件只保证它是一块面板。
      */}
      <DialogPrimitive.Content
        className={cn(
          "soj-sheet fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,460px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto text-soj-text",
          className,
        )}
        {...props}
      >
        {children}
        {/* 关闭按钮。Radix 只保证 Esc 与点击遮罩能关，**不渲染任何可见的关闭控件**——
            少了它，弹窗里就只有一条看不见的出路：读者会去按浏览器的返回，
            或者以为这一层卡住了。触屏上尤其明显，那里没有 Esc 可按。 */}
        <DialogPrimitive.Close
          aria-label={t("common.close")}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-soj-sm text-soj-muted transition hover:bg-soj-surface hover:text-soj-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-soj-accent"
        >
          <X aria-hidden className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: DialogPrimitive.DialogTitleProps) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogPrimitive.DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn("mt-2 text-sm leading-6 text-soj-muted", className)} {...props} />;
}
