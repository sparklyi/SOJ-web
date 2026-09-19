import { ArrowRight } from "lucide-react";
import { CountUp } from "@/components/fx/count-up";
import { LocalizedLink } from "@/components/i18n/localized-link";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/server";
import styles from "./home-plinth.module.css";

type PlinthFact = {
  label: string;
  value: number;
  suffix?: string;
  /**
   * 小数位必须由调用方给定。
   * 首屏默认按整数滚动，若把 31.6 交给它就会渲染成 32，
   * 而页面别处同一个指标写的是 31.6% —— 同一个数字两种写法，
   * 是这类页面最容易被一眼看穿的破绽。
   */
  decimals?: number;
};

/**
 * 首页展台。
 *
 * 它是「展品」，不是「入口」：不放目录、不放别页的数据表、也不解释判题怎么跑——
 * **读这个页面的人本来就刷题**，跟他讲「提交会先在沙箱里编译」是把人当外行。
 *
 * ── 字标为什么回到「排字」────────────────────────────────────────────────
 *
 * 中间试过一版：把 S/O/J 三个字形用 SVG 亲手画出来，按内容列宽度等比撑满。
 * 那一版被否掉，两条都成立：
 *   · **丑。** 手绘字形没有字体度量的约束，曲线的张力全靠手感，放大之后
 *     S 的两个碗、J 的下钩都不够利落——它读起来像「随便拉出来的形状」，
 *     而不是一套被设计过的字形。换字体不是解，自己画也不是解。
 *   · **它占掉了整个上半屏。** 字标撑满列宽后高度跟着列宽走，
 *     1440 视口上它自己就有 400px 高。首页第一屏被三个字母占满，
 *     读者要滚动才能看到这个站是干什么的——主次反了。
 *
 * 现在的做法是把站名当**排字**处理，而不是当图形：
 *   `SOJ` 用展示字排出来（不描摹、不变形），右边接一个品类词「在线测评平台」。
 * 名字 + 品类，这是任何一家公司最标准的锁定式（lockup），
 * 也是它最该长的样子：**读者一眼知道这是什么，同时不需要滚动。**
 * 字号收到原来的三分之一上下，省下的高度还给留白。
 *
 * ── 构图：整页居中 ────────────────────────────────────────────────────────
 *
 * 上一版是左对齐。改成居中是因为这一页已经收得只剩三件东西
 * （锁定式 / 定位句 / 数字铭牌），左对齐会让右侧空出半屏——那不是留白，是没做完。
 * 居中之后重量在轴线上，两侧的空白是对称的，读起来才是「陈列」。
 *
 * 版式上仍然**没有盒子**：没有任何 border-radius 与四周描边，
 * 只有一条结构性线条（铭牌上沿的受光线）。卡片是信息容器，展台是陈列。
 *
 * 数字放在铭牌上，是因为它们回答同一个问题：**这个站有多大、我要用的语言支不支持。**
 * 都是全站尺度的聚合，不是「某个人的提交数」——后者对访客毫无意义。
 * 「比赛场次」曾经也在这一排，已撤掉：它是运营流水，不是站级体量。
 *
 * 动效：本组件不自播任何动画，只有随滚动轻微后撤；
 * 不支持滚动时间轴的浏览器就是一张静帧。
 */
export async function HomePlinth({ facts = [] }: { facts?: PlinthFact[] }) {
  const [t, locale] = await Promise.all([getServerTranslator(), getServerLocale()]);

  return (
    <section className={styles.plinth} data-home-plinth aria-labelledby="soj-plinth-title">
      <div className={styles.spot} aria-hidden="true" />

      {/* data-plinth-stage 供度量脚本确认滚动联动是否真的挂上了 */}
      <div className={styles.stage} data-plinth-stage>
        <h1 className={styles.lockup} id="soj-plinth-title">
          <span className={styles.mark}>SOJ</span>
          <span className={styles.category}>{t("home.plinth.category")}</span>
        </h1>
        <p className={styles.lead}>{t("home.plinth.lead")}</p>
      </div>

      <div className={styles.plate}>
        <dl className={styles.readings}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.reading}>
              <dt>{fact.label}</dt>
              <dd>
                <CountUp value={fact.value} locale={locale} decimals={fact.decimals ?? 0} />
                {fact.suffix ? <span className={styles.unit}>{fact.suffix}</span> : null}
              </dd>
            </div>
          ))}
        </dl>

        {/* 展台只留**一个**出口，而且它**不是按钮**。
            上一版这里用 buttonVariants 渲染，出来是一枚发亮的镀铬胶囊——
            整页唯一一件有立体感的东西。这里改成排字式链接：
            一行等宽字 + 一枚会位移的箭头，和这一页是同一套材料。
            底线也不要：它会被读成「没有底色的按钮边框」，而这一页只有一个出口，
            不需要靠一圈线声明自己可点。 */}
        <LocalizedLink className={styles.enter} href="/problems">
          {t("home.exploreProblems")}
          <ArrowRight aria-hidden className={styles.enterIcon} />
        </LocalizedLink>
      </div>
    </section>
  );
}
