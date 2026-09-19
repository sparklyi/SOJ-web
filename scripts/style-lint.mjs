import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";

if (!existsSync("app")) {
  console.error("Expected Next.js app directory to exist.");
  process.exit(1);
}

const roots = ["app", "components", "features"].filter((path) => existsSync(path));
const forbiddenImports = [
  "antd",
  "ant-design-vue",
  "element-plus",
  "vue",
  "vue-router",
  "pinia",
];
const forbiddenClassFragments = [
  "bg-purple",
  "from-purple",
  "to-purple",
  "rounded-2xl",
  "rounded-3xl",
];

const issues = [];

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!/\.(css|tsx|ts|jsx|js)$/.test(entry.name)) continue;
    if (path === "app/globals.css") continue;
    checkFile(path);
  }
}

function checkFile(path) {
  const source = readFileSync(path, "utf8");
  const relative = path.replace(`${cwd()}/`, "");

  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) {
    issues.push(`${relative}: raw hex color found. Use SOJ design tokens.`);
  }
  // 不能写成 /\brgb\(/：Tailwind 的任意值语法用下划线代替空格，
  // 于是 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] 里 rgb 前面是下划线，
  // 而 \b 不认为 `_` 与 `r` 之间存在词边界 —— 这条规则被整批绕过。
  // 改成「前面不是字母」，下划线/空格/引号都能命中，而 rgbxxx( 这种标识符不会误报。
  if (/(?<![A-Za-z])rgba?\(/.test(source)) {
    issues.push(`${relative}: raw rgb/rgba color found. Use SOJ design tokens.`);
  }
  for (const item of forbiddenImports) {
    const pattern = new RegExp(`from ["']${item}["']|import\\(["']${item}["']\\)`);
    if (pattern.test(source)) {
      issues.push(`${relative}: forbidden legacy UI/runtime import '${item}'.`);
    }
  }
  for (const item of forbiddenClassFragments) {
    if (source.includes(item)) {
      issues.push(`${relative}: forbidden class fragment '${item}'.`);
    }
  }
  if (/LocalButton|CustomInput|PageTabs/.test(source)) {
    issues.push(`${relative}: possible page-local primitive. Use shared UI components.`);
  }
  if ((relative.startsWith("app/") || relative.startsWith("features/")) && /<button\s+className=/.test(source)) {
    issues.push(`${relative}: page-local button styling found. Use components/ui/button.`);
  }
}

for (const root of roots) {
  walk(root);
}

if (issues.length > 0) {
  console.error("SOJ style lint failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}
