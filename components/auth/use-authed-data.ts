"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/errors";

export type AuthedData<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "auth" }
  | { status: "notFound" }
  | { status: "error"; message: string };

/**
 * 给「必须登录才能看」的内容页用的取数 hook。
 *
 * 使用前提：调用方只应在 `SessionGate` 放行**之后**挂载（这正是各内容页的结构），
 * 所以正常路径不会撞到 401；401 / not_found 分支是对「会话在取数中途过期」
 * 「题目/比赛确实不存在」这两种真实状态的兜底，否则它们会各自退化成一整页报错。
 *
 * 取数在挂载时发生一次，参数变化靠调用方用 `key` 重挂载来表达
 * （路由参数变化时 Next 本来就会重挂页面）。
 */
export function useAuthedData<T>(load: () => Promise<T>): AuthedData<T> {
  const [state, setState] = useState<AuthedData<T>>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    load().then(
      (data) => {
        if (alive) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (!alive) return;
        if (error instanceof ApiError && error.status === 401) {
          setState({ status: "auth" });
          return;
        }
        if (error instanceof ApiError && error.code === "not_found") {
          setState({ status: "notFound" });
          return;
        }
        setState({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      },
    );

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load 捕获的是挂载时的路由参数，组件随参数重挂
  }, []);

  return state;
}
