"use client";

import { useEffect, useState } from "react";
import { getApiMode } from "@/lib/api/mode";
import { restoreSession } from "@/lib/auth/session";

/**
 * 「这个浏览器现在能不能执行需要登录的动作」。
 *
 * 与内容页的 `SessionGate` 不同：门禁要等一次会话校验，而按钮的可用状态
 * 可以同步读 localStorage，不必等网络往返——否则每个受限按钮在首帧都会
 * 闪一下「可点」。所以这里直接读会话，不查后端。
 *
 * mock 模式恒为 true：演示夹具里没有真实会话，用登录墙挡住会让评审
 * 看不到功能本身长什么样。这是**故意**的差异，不是漏判。
 *
 * 监听 `storage` 是为了跨标签页同步：在另一个标签页登录后，
 * 这个标签页的按钮应该跟着变成可用。
 */
export function useBrowserSessionAvailable() {
  const [available, setAvailable] = useState(() => getApiMode() === "mock");

  useEffect(() => {
    function update() {
      setAvailable(getApiMode() === "mock" || browserHasSession());
    }

    update();
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return available;
}

function browserHasSession() {
  if (typeof window === "undefined") return false;
  return Boolean(restoreSession(window.localStorage));
}
