import { MotionBlock } from "@/components/fx/motion-block";
import { PageShell } from "@/components/layout/page-shell";
import { loadHomeData } from "@/features/home/api";
import { HomePlinth } from "@/features/home/home-plinth";
import { JoinUs } from "@/features/home/join-us";
import { getServerTranslator } from "@/lib/i18n/server";

/**
 * 首页。
 *
 * 它是**展台**，不是数据入口，也不是产品说明书。这三件事的区别决定了一切：
 *
 * ── 不做什么 ──────────────────────────────────────────────────────────────
 *
 * · **不做目录。** 顶部导航已经在回答「去哪儿」了，首页再做一遍就是多余的。
 *   判据：一块内容拿掉之后，用户还能从导航去到同一处，它就是导航的重复。
 *   按这条判据，「推荐题目」「题库样张」「比赛列表」全部出局。
 *
 * · **不解释常识。** 曾经有整整一段在讲「提交 → 编译 → 跑测试点 → 出判定」。
 *   会点进一个刷题站的人不需要被告知判题是怎么跑的；对着他讲这个，是把人当外行。
 *   同类的还有「三步开始：注册账号 → 挑一道题 → 提交」——那是产品常识，不是内容。
 *
 * · **不摆具体清单。** 支持哪些语言、有哪些专题标签、难度怎么分布——
 *   这些是题库页该回答的。首页只留尺度（几个数），不留目录。
 *   「比赛场次」也在这一条里：运营流水不进首页。
 *
 * ── 做什么 ────────────────────────────────────────────────────────────────
 *
 *   展台（HomePlinth） —— 锁定式「站名 + 品类词」+ 一句定位 + 站级数字 + 一个出口
 *   加入我们（JoinUs）  —— 一整块可点的邀请，点开弹窗再分注册 / 登录
 *
 * 两块都是「陈述」，没有一块在教人。第一块回答「这是什么、有多大」，
 * 第二块回答「我怎么进去」。答完就结束。
 *
 * ── 页脚 ──────────────────────────────────────────────────────────────────
 *
 * 这一页曾经**没有页脚**，理由是当时的候选内容全是假入口：文档、状态、关于——
 * 这些页面并不存在，编几个链接出去就是让读者点了发现是死路。
 * 现在页脚由根布局统一提供（版权 / 开源仓库 / 问题反馈，三样都有真实落点），
 * 所以这里的规则改写为更准确的那一条：**不放没有落处的链接**，
 * 而不是「不要页脚」。假入口比缺一个页脚糟得多，这条没变。
 *
 * 两段之间只有 <div> 的间距与 MotionBlock 的入场揭示：
 * 页面骨架就是「展台 → 邀请」，没有第三件事要放。
 * 动效由读者的滚动产生，再加上环境层里那层光照微尘
 * （见 app-atmosphere.tsx 的 plinth 档与 components/fx/mote-field.tsx：
 * 空气可以动，墙面与灯不行）。
 */
export default async function HomePage() {
  const t = await getServerTranslator();
  const facts = await loadHomeData();

  return (
    <PageShell>
      <div className="grid min-w-0 gap-6">
        <HomePlinth
          facts={[
            { label: t("home.facts.problems"), value: facts.problems },
            { label: t("home.facts.submissions"), value: facts.submissions },
            { label: t("home.facts.languages"), value: facts.languages },
          ]}
        />

        <MotionBlock>
          <JoinUs />
        </MotionBlock>
      </div>
    </PageShell>
  );
}
