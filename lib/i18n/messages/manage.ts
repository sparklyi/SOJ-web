import type { MessageCatalog } from "../types";

export const manageMessages = {
  "nav.workbench": { en: "Workbench", "zh-CN": "工作台" },

  "manage.title": { en: "Workbench", "zh-CN": "工作台" },
  "manage.description": {
    en: "Authoring, review, and rejudge surfaces, filtered by the permissions your account holds.",
    "zh-CN": "出题、审核与重测入口，按当前账号持有的权限展示。",
  },

  "manage.card.authoring.label": { en: "Authoring", "zh-CN": "出题" },
  "manage.card.authoring.description": {
    en: "Create problems, keep statements and test data up to date, and submit them for review.",
    "zh-CN": "创建题目，维护题面与测试数据，并提交审核。",
  },
  "manage.card.review.label": { en: "Review", "zh-CN": "审核" },
  "manage.card.review.description": {
    en: "Approve problems in the review queue or send them back to the author with a reason.",
    "zh-CN": "处理审核队列：通过发布，或附原因退回作者修改。",
  },
  "manage.card.rejudge.label": { en: "Rejudge", "zh-CN": "重测" },
  "manage.card.rejudge.description": {
    en: "Re-run submissions for a problem and follow the batch progress.",
    "zh-CN": "按题目重跑提交，并跟踪批次进度。",
  },
} satisfies MessageCatalog;
