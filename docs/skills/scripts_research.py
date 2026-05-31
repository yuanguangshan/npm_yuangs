#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""微信读书主题研究主流程

用法：
  python3 research.py --keyword "大模型" --top-n 5 --reviews-per-book 3 \
      --output /sandbox/workspace/outputs/weread_research_dmodel_20260529.md

依赖环境变量：WEREAD_API_KEY
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime

GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"


def call_api(api_name, **params):
    """通过 curl 调用微信读书 API。params 平铺到 JSON 根，不嵌套。"""
    key = os.environ.get("WEREAD_API_KEY", "").strip()
    if not key:
        print("[FATAL] WEREAD_API_KEY 为空，请先 export", file=sys.stderr)
        sys.exit(2)

    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    body_str = json.dumps(body, ensure_ascii=False)

    cmd = [
        "curl", "-sS", "-X", "POST", GATEWAY,
        "-H", "Authorization: Bearer " + key,
        "-H", "Content-Type: application/json",
        "-d", body_str,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if proc.returncode != 0:
        print("[ERR] curl failed:", proc.stderr, file=sys.stderr)
        return None
    try:
        data = json.loads(proc.stdout)
    except Exception as e:
        print("[ERR] JSON decode:", e, "raw=", proc.stdout[:300], file=sys.stderr)
        return None
    if isinstance(data, dict) and data.get("errcode"):
        print("[ERR] api errcode=", data.get("errcode"), "msg=", data.get("errmsg"), file=sys.stderr)
        return None
    return data


def search_books(keyword, candidate_count=20):
    """搜索电子书（scope=10），返回 books 列表。"""
    data = call_api("/store/search", keyword=keyword, scope=10, count=candidate_count)
    if not data:
        return []
    results = data.get("results") or []
    books = []
    for group in results:
        # 兼容新旧 API：scope 可能是 10（旧版）或 17（新版电子书分组）
        gscope = group.get("scope")
        if gscope in (10, 17):
            books.extend(group.get("books") or [])
    return books


def pick_top(books, top_n=5):
    """按评分降序挑前 N 本。评分=bookInfo.newRating(0-1000)，需 newRatingCount>=20 防冷门。"""
    def score(b):
        bi = b.get("bookInfo", {})
        return (bi.get("newRating") or 0, bi.get("newRatingCount") or 0)

    valid = [b for b in books if not b.get("bookInfo", {}).get("soldout")]
    qualified = [b for b in valid if (b.get("bookInfo", {}).get("newRatingCount") or 0) >= 20]
    if len(qualified) < top_n:
        qualified = valid
    qualified.sort(key=score, reverse=True)
    return qualified[:top_n]


def get_book_detail(book_id):
    return call_api("/book/info", bookId=book_id)


def get_reviews(book_id, count=20):
    """取推荐池评论 reviewListType=1。"""
    return call_api("/review/list", bookId=book_id, reviewListType=1, count=count)


def select_quality_reviews(review_data, n=3):
    """从评论列表中精选 n 条有信息密度的。"""
    if not review_data:
        return []
    reviews = review_data.get("reviews") or []
    candidates = []
    for item in reviews:
        r = item.get("review", {}).get("review", {})
        content = (r.get("content") or "").strip()
        if len(content) < 80:
            continue
        if content.count("！") + content.count("!") > len(content) / 10:
            continue  # 过滤纯感叹型水评
        candidates.append({
            "author": r.get("author", {}).get("name", "匿名"),
            "star": r.get("star", 0),
            "isFinish": r.get("isFinish", False),
            "content": content,
            "length": len(content),
        })
    # 排序：读完+五星优先，其次按长度
    candidates.sort(key=lambda x: (x["isFinish"], x["star"] == 100, x["length"]), reverse=True)
    return candidates[:n]


def get_best_bookmarks(book_id):
    """获取书籍热门划线（Popular Highlights），按热度排序，固定返回前 20 条。"""
    data = call_api("/book/bestbookmarks", bookId=book_id, chapterUid=0, synckey=0)
    if not data:
        return []
    items = data.get("items") or []
    chapters = {c["chapterUid"]: c["title"] for c in data.get("chapters", []) if c.get("title")}
    for item in items:
        item["_chapterTitle"] = chapters.get(item.get("chapterUid"), "")
    return items


def star_to_emoji(star):
    n = int((star or 0) // 20)
    return "⭐" * n if n > 0 else ""


def render_markdown(keyword, picks, top_n, reviews_per_book):
    """生成 Markdown 文章。picks 为 [{search_book, detail, reviews}, ...]。"""
    today = datetime.now().strftime("%Y-%m-%d")
    lines = []
    lines.append("# 主题书单 · {}".format(keyword))
    lines.append("")
    lines.append("> 微信读书主题研究 · {} · 精选 {} 本".format(today, top_n))
    lines.append("")
    lines.append("## 主题导读")
    lines.append("")
    lines.append("围绕「{}」这一主题，本期从微信读书评分前列的书目中精选 {} 本，".format(keyword, top_n))
    lines.append("按评分降序排列。每本附书籍简介、读者评分与若干高质量读者点评，")
    lines.append("帮你在投入完整阅读时间前，快速判断这本书是否值得加入书单。")
    lines.append("")
    lines.append("---")
    lines.append("")

    for idx, item in enumerate(picks, 1):
        sb = item["search_book"]
        detail = item.get("detail") or {}
        binfo = sb.get("bookInfo", {})
        title = detail.get("title") or binfo.get("title", "未知")
        author = detail.get("author") or binfo.get("author", "未知")
        translator = detail.get("translator", "")
        publisher = detail.get("publisher", "")
        publish_time = detail.get("publishTime", "")
        intro = (detail.get("intro") or binfo.get("intro") or "").strip()
        # search 接口 bookInfo.newRating 是 0-1000，需 /10；book/info 的 newRating 已是百分制
        rating_raw = binfo.get("newRating") or 0
        rating = round(rating_raw / 10.0, 1) if rating_raw else 0
        rating_count = binfo.get("newRatingCount") or detail.get("newRatingCount") or 0
        rating_tag = (binfo.get("newRatingDetail") or {}).get("title", "")
        reading_count = sb.get("readingCount") or 0

        lines.append("## {}. {}".format(idx, title))
        lines.append("")
        meta_parts = ["**作者**：{}".format(author)]
        if translator:
            meta_parts.append("**译者**：{}".format(translator))
        if publisher:
            meta_parts.append("**出版社**：{}".format(publisher))
        if publish_time:
            meta_parts.append("**出版**：{}".format(publish_time[:10]))
        lines.append(" · ".join(meta_parts))
        lines.append("")
        rating_line = "**评分**：{} 分".format(rating)
        if rating_count:
            rating_line += "（{} 人评）".format(rating_count)
        if rating_tag:
            rating_line += " · {}".format(rating_tag)
        if reading_count:
            rating_line += " · 在读 {}".format(reading_count)
        lines.append(rating_line)
        lines.append("")

        if intro:
            lines.append("### 内容简介")
            lines.append("")
            # 简介可能很长，整段保留
            lines.append(intro)
            lines.append("")

        reviews = item.get("reviews") or []
        if reviews:
            lines.append("### 精选读者点评")
            lines.append("")
            for r in reviews:
                head = "**{}** {}".format(r["author"], star_to_emoji(r["star"]))
                if r["isFinish"]:
                    head += " · 已读完"
                lines.append(head)
                lines.append("")
                # 评论原文用引用块
                for ln in r["content"].splitlines():
                    lines.append("> {}".format(ln) if ln.strip() else ">")
                lines.append("")
        else:
            lines.append("_暂无精选点评。_")
            lines.append("")

        # 热门划线
        bookmarks = item.get("bookmarks") or []
        if bookmarks:
            lines.append("### 热门划线")
            lines.append("")
            for bm in bookmarks[:10]:  # 最多展示 10 条
                text = (bm.get("markText") or "").strip()
                count = bm.get("totalCount") or 0
                chapter = bm.get("_chapterTitle", "")
                if not text:
                    continue
                if chapter:
                    lines.append("> {}  —  _{} · {} 人划线_".format(text, chapter, count))
                else:
                    lines.append("> {}  —  _{} 人划线_".format(text, count))
                lines.append("")
        else:
            lines.append("_暂无热门划线数据。_")
            lines.append("")

        lines.append("---")
        lines.append("")

    lines.append("## 阅读建议")
    lines.append("")
    lines.append("- **入门优先**：评分人数多、评分≥85 的书更适合先读，社群验证充分。")
    lines.append("- **深度补充**：评分稍低但有独特视角的书，可作为主题理解的对照面。")
    lines.append("- **评论参考**：优质评论是「是否值得读」的二阶信号，比单纯评分更可靠。")
    lines.append("")
    lines.append("_本文由 weread-topic-research 自动生成 · 数据来源：微信读书_")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="微信读书主题研究")
    parser.add_argument("--keyword", required=True, help="主题关键词")
    parser.add_argument("--top-n", type=int, default=5, help="精选数量，默认 5")
    parser.add_argument("--reviews-per-book", type=int, default=3, help="每本评论数，默认 3")
    parser.add_argument("--candidate-count", type=int, default=20, help="搜索候选池大小")
    parser.add_argument("--output", required=True, help="输出 Markdown 路径")
    args = parser.parse_args()

    print("[1/4] 搜索关键词:", args.keyword)
    books = search_books(args.keyword, args.candidate_count)
    print("  → 获得候选 {} 本".format(len(books)))
    if not books:
        print("[FATAL] 搜索结果为空，请换关键词", file=sys.stderr)
        sys.exit(3)

    print("[2/4] 按评分筛选 top", args.top_n)
    picks_raw = pick_top(books, args.top_n)
    for i, b in enumerate(picks_raw, 1):
        binfo = b.get("bookInfo", {})
        rating = (binfo.get("newRating") or 0) / 10.0
        print("  {}. {} (评分 {} / {} 人)".format(
            i, binfo.get("title"), rating, binfo.get("newRatingCount") or 0))

    print("[3/4] 抓取详情、评论与热门划线...")
    picks = []
    for b in picks_raw:
        bid = b.get("bookInfo", {}).get("bookId")
        if not bid:
            continue
        detail = get_book_detail(bid)
        rdata = get_reviews(bid, count=30)
        sel = select_quality_reviews(rdata, args.reviews_per_book)
        bookmarks = get_best_bookmarks(bid)
        picks.append({"search_book": b, "detail": detail, "reviews": sel, "bookmarks": bookmarks})
        bm_count = len(bookmarks)
        print("  · {} → 评论 {} 条 · 热门划线 {} 条".format(
            b.get("bookInfo", {}).get("title"), len(sel), bm_count))

    print("[4/4] 渲染 Markdown（含热门划线）→ {}".format(args.output))
    md = render_markdown(args.keyword, picks, args.top_n, args.reviews_per_book)
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md)
    print("✅ 完成 · {} chars · {}".format(len(md), args.output))


if __name__ == "__main__":
    main()
