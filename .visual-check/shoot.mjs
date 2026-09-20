import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "/tmp/soj-v3";
const BASE = "http://127.0.0.1:3000";

const ROUTES = {
  home: "/zh-CN",
  problems: "/zh-CN/problems",
  "prob-detail": "/zh-CN/problems/1",
  contests: "/zh-CN/contests",
  "contest-detail": "/zh-CN/contests/1",
  scoreboard: "/zh-CN/contests/1/scoreboard",
  arena: "/zh-CN/contests/1/arena",
  submissions: "/zh-CN/submissions",
  "submission-detail": "/zh-CN/submissions/5",
  me: "/zh-CN/me",
  settings: "/zh-CN/settings",
  "style-guide": "/zh-CN/style-guide",
  login: "/zh-CN/auth/login",
};

const wanted = process.argv.slice(2);
const names = wanted.length ? wanted : Object.keys(ROUTES);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

const problems = [];

for (const name of names) {
  const path = ROUTES[name];
  if (!path) {
    console.log(`?? unknown route: ${name}`);
    continue;
  }
  const errors = [];
  const onConsole = (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
  };
  page.on("console", onConsole);

  const response = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
  const status = response?.status();

  // 滚动揭示是 IntersectionObserver 驱动的，截整页时下方内容还处于「已上膛但未揭示」
  // 的状态（opacity: 0）。这是截图工具的限制而非运行时缺陷，所以这里显式揭示。
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal="armed"]').forEach((el) => el.classList.add("is-revealed"));
  });
  await page.waitForTimeout(700);

  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}/${name}-fold.png`, fullPage: false });

  // 体检：氛围层是否就位、有没有真实容器被误隐藏
  const report = await page.evaluate(() => {
    const atmo = document.querySelector(".soj-atmo");
    const canvas = document.querySelector(".soj-atmo canvas");
    const hidden = [];
    for (const el of document.querySelectorAll("main section, main header, main h1")) {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === "none" || rect.height === 0) {
        hidden.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
      }
    }
    return {
      atmo: atmo ? atmo.getAttribute("data-atmo") : null,
      canvas: canvas ? `${canvas.width}x${canvas.height}` : null,
      hidden: hidden.slice(0, 5),
      h1: document.querySelector("main h1")?.textContent?.trim().slice(0, 40) ?? null,
      scrollH: document.documentElement.scrollHeight,
    };
  });

  page.off("console", onConsole);
  console.log(
    `${name.padEnd(18)} ${String(status).padEnd(4)} atmo=${String(report.atmo).padEnd(6)} canvas=${String(report.canvas).padEnd(11)} h=${String(report.scrollH).padEnd(6)} h1=${report.h1}${report.hidden.length ? ` HIDDEN:${report.hidden.join("|")}` : ""}${errors.length ? ` ERR:${errors[0]}` : ""}`,
  );
  if (errors.length) problems.push(`${name}: ${errors.join(" / ")}`);
}

await browser.close();
console.log(problems.length ? `\nconsole errors:\n${problems.join("\n")}` : "\nno console errors");
