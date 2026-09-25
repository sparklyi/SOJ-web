"use client";

import { useEffect, useState } from "react";
import { restoreSession, sessionChangeEvent } from "@/lib/auth/session";

/**
 * 「这个浏览器现在能不能执行需要登录的动作」。
 *
 * 与内容页的 `SessionGate` 不同：门禁要等一次会话校验，而按钮的可用状态
 * 可以同步读 localStorage，不必等网络往返——否则每个受限按钮在首帧都会
 * 闪一下「可点」。所以这里直接读会话，不查后端。
 *
 * **不再对 mock 模式放行。** 之前 mock 恒为 true，理由是「演示夹具里没有
 * 真实会话」；但那让评审在未登录时也能点提交/运行，看到的是一套真实部署里
 * 不存在的流程。mock 现在同样要求会话：mock 登录接受任意邮箱密码，
 * 想走提交路径就先登录，这才和线上一致。
 *
 * 监听两个信号：`soj:session-change`（同标签页登录/登出，`saveSession`/`clearSession`
 * 派发）与 `storage`（另一个标签页的变更）。少了前者，登录后当前页的按钮
 * 要等到下次整页导航才解禁。
 */
export function useBrowserSessionAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    function update() {
      setAvailable(browserHasSession());
    }

    update();
    window.addEventListener(sessionChangeEvent, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(sessionChangeEvent, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return available;
}

function browserHasSession() {
  if (typeof window === "undefined") return false;
  return Boolean(restoreSession(window.localStorage));
}
