#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""微信读书深度导读——单本书的章节目录骨架 + 热门划线 + 读者思考

用法：
  python3 scripts_deep_read.py --book-id "25135387" \
      --output /tmp/weread_deep_流浪地球.md
  python3 scripts_deep_read.py --book-title "三体" \
      --output /tmp/weread_deep_三体.md

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


import time

def call_api(api_name, **params):
    """通过 curl 调用微信读书 API。params 平铺到 JSON 根，不嵌套。"
    带指数退避重试（最多 3 次），避免触发限流。"""
    key = os.environ.get("WEREAD_API_KEY", "").strip()
    if not key:
        print("[FATAL] WEREAD_API_KEY 为空", file=sys.stderr)
        sys.exit(2)

    body = {"api_name": api_name, "skill_version": SKILL_VERSION}
    body.update(params)
    body_str = json.dumps(body, ensure_ascii=False)

    max_retries = 3
    for attempt in range(max_retries):
        cmd = [
            "curl", "-sS", "-X", "POST", GATEWAY,
            "-H", "Authorization: Bearer " + key,
            "-H", "Content-Type: application/json",
            "-d", body_str,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if proc.returncode == 0:
            try:
                data = json.loads(proc.stdout)
            except Exception as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                print("[ERR] JSON decode:", e, file=sys.stderr)
                return None
            if isinstance(data, dict) and data.get("errcode"):
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                print("[ERR] api errcode=%s msg=%s" % (data.get("errcode"), data.get("errmsg")), file=sys.stderr)
                return None
            return data
        if attempt < max_retries - 1:
            time.sleep(2 ** attempt)
    print("[ERR] curl failed after %d retries: %s" % (max_retries, proc.stderr[:200]), file=sys.stderr)
    return None


def search_book_id(keyword):
    """通过搜索获取第一本书的 bookId。"""
    data = call_api("/store/search", keyword=keyword, scope=10, count=5)
    if not data:
        return None
    for g in data.get("results") or []:
        if g.get("scope") in (10, 17):
            books = g.get("books") or []
            for b in books:
                if not b.get("bookInfo", {}).get("soldout"):
                    return b["bookInfo"]["bookId"]
    return None


def get_chapters(book_id):
    """获取书籍章节目录。"""
    data = call_api("/book/chapterinfo", bookId=book_id)
    if not data:
        return []
    chapters = data.get("chapters") or []
    # 过滤有效章节（有标题、不是目录/附录等特殊层级）
    return [c for c in chapters if c.get("title") and c.get("chapterUid")]


def render_markdown(book_info, chapters, chapters_bookmarks, total_chapter_count):
    """生成深度导读 Markdown。"""
    today = datetime.now().strftime("%Y-%m-%d")
    title = book_info.get("title", "未知")
    author = book_info.get("author", "未知")

    lines = []
    lines.append("# 深度导读 · {}".format(title))
    lines.append("")
    lines.append("> 微信读书深度导读 · {} · {} 章 · 精选热门划线".format(today, total_chapter_count))
    lines.append("")
    lines.append("## 书籍信息")
    lines.append("")
    lines.append("- **书名**：{}".format(title))
    lines.append("- **作者**：{}".format(author))
    lines.append("- **评分**：{} 分（{} 人评）".format(
        round((book_info.get("newRating") or 0) / 10.0, 1),
        book_info.get("newRatingCount") or 0))
    publisher = book_info.get("publisher", "")
    if publisher:
        lines.append("- **出版社**：{}".format(publisher))
    intro = (book_info.get("intro") or "").strip()
    if intro:
        lines.append("- **简介**：{}".format(intro[:200] + "…" if len(intro) > 200 else intro))
    lines.append("")

    total_bookmarks = 0
    chapter_count = 0
    for ch in chapters:
        bms = chapters_bookmarks.get(ch["chapterUid"], [])
        if bms:
            chapter_count += 1
            total_bookmarks += len(bms)

    lines.append("## 导读")
    lines.append("")
    lines.append("本文以《{}》的原始章节目录为骨架，从 {} 个有热门划线的章节中，".format(title, chapter_count))
    lines.append("精选 {} 条读者标注最多的金句，并附上其他读者对这些段落的深度思考。".format(total_bookmarks))
    lines.append("帮助你快速把握全书的精华脉络。")
    lines.append("")
    lines.append("---")
    lines.append("")

    for ch in chapters:
        bms = chapters_bookmarks.get(ch["chapterUid"], [])
        if not bms:
            continue

        chapter_title = ch.get("title", "第{}章".format(ch.get("chapterIdx", "?")))
        level = ch.get("level", 0)

        lines.append("## {}. {}".format(ch.get("chapterIdx", ""), chapter_title))
        lines.append("")

        for bm in bms:
            text = (bm.get("markText") or "").strip()
            count = bm.get("totalCount") or 0
            if not text:
                continue

            lines.append("### 📍 热门划线（{} 人）".format(count))
            lines.append("")
            lines.append("> {}".format(text))
            lines.append("")

            # 读者思考
            thoughts = bm.get("_thoughts", [])
            if thoughts:
                lines.append("**读者思考：**")
                lines.append("")
                for t in thoughts[:10]:  # 最多 10 条
                    content = (t.get("content") or "").strip()
                    author_name = (t.get("author", {}) or t.get("authorName", "匿名"))
                    if isinstance(author_name, dict):
                        author_name = author_name.get("name", "匿名")
                    if content and len(content) > 20:
                        lines.append("> 💬 **{}**：".format(author_name))
                        for line_text in content.splitlines():
                            lines.append("> {}".format(line_text) if line_text.strip() else ">")
                        lines.append("")
    # 全局提取书评（只做一次）
    if not hasattr(render_markdown, "_all_reviews"):
        try:
            rd = call_api("/review/list", bookId=book_id, reviewListType=1, count=10)
            render_markdown._all_reviews = []
            if rd:
                for rv_item in rd.get("reviews") or []:
                    r = rv_item.get("review", {}).get("review", {})
                    content = (r.get("content") or "").strip()
                    author = (r.get("author", {}) or {}).get("name", "匿名")
                    if content and len(content) > 100:
                        render_markdown._all_reviews.append({"content": content, "author": author})
        except Exception:
            render_markdown._all_reviews = []

    # 延伸书评
    if render_markdown._all_reviews:
        lines.append("## 延伸书评")
        lines.append("")
        for rv in render_markdown._all_reviews[:5]:
            lines.append("### 💬 {}".format(rv["author"]))
            lines.append("")
            for line_text in rv["content"].splitlines()[:10]:
                lines.append("> {}".format(line_text) if line_text.strip() else ">")
            lines.append("---")
            lines.append("")

    lines.append("## 阅读建议")
    lines.append("")
    lines.append("这份深度导读适合已经读过原书、希望回顾精华的读者，")
    lines.append("也适合想要快速了解一本书核心观点的读者。")
    lines.append("热门划线是千万读者共同认可的精华段落，读者思考则提供了多元的解读视角。")
    lines.append("")
    lines.append("_本文由 weread-deep-read 自动生成 · 数据来源：微信读书_")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="微信读书深度导读")
    parser.add_argument("--book-id", help="书籍 ID")
    parser.add_argument("--book-title", help="书名（自动搜索）")
    parser.add_argument("--output", required=True, help="输出 Markdown 路径")
    args = parser.parse_args()

    # 确定 bookId
    book_id = args.book_id
    if not book_id and args.book_title:
        print("[1/5] 搜索书名:", args.book_title)
        book_id = search_book_id(args.book_title)
        if not book_id:
            print("[FATAL] 未找到书籍", file=sys.stderr)
            sys.exit(3)
        print("  → bookId:", book_id)
    elif not book_id:
        print("[FATAL] 需要 --book-id 或 --book-title", file=sys.stderr)
        sys.exit(2)

    # 获取书籍信息
    print("[2/5] 获取书籍信息...")
    book_info = call_api("/book/info", bookId=book_id)
    if not book_info:
        sys.exit(3)
    title = book_info.get("title", "未知")
    print("  → {}".format(title))

    # 获取章节目录
    print("[3/5] 获取章节目录...")
    chapters = get_chapters(book_id)
    print("  → {} 个章节".format(len(chapters)))

    # 获取热门划线
    print("[4/5] 获取热门划线...")
    bm_data = call_api("/book/bestbookmarks", bookId=book_id, chapterUid=0, synckey=0)
    items = bm_data.get("items") or [] if bm_data else []
    print("  → {} 条划线".format(len(items)))

    # 按章节分组 + 批量获取读者思考（合并同章节 range，减少请求数）
    chapters_bookmarks = {}
    chapter_items = {}
    for item in items:
        cu = item.get("chapterUid")
        if cu not in chapter_items:
            chapter_items[cu] = []
        chapter_items[cu].append(item)
        if cu not in chapters_bookmarks:
            chapters_bookmarks[cu] = []
        chapters_bookmarks[cu].append(item)

    for cu, citems in chapter_items.items():
        ranges = [it.get("range", "") for it in citems if it.get("range")]
        if not ranges or not cu:
            continue
        try:
            # 一次请求查该章节所有划线
            reviews_param = [{"range": r, "count": 20} for r in ranges]
            rr = call_api("/book/readreviews", bookId=book_id, chapterUid=cu, reviews=reviews_param)
            if rr:
                range_map = {}
                for rv in rr.get("reviews") or []:
                    r_range = rv.get("range")
                    thoughts = []
                    for pr in rv.get("pageReviews") or []:
                        r = pr.get("review", {})
                        thoughts.append({
                            "content": r.get("content", ""),
                            "author": r.get("author", {}).get("name", "匿名"),
                        })
                    range_map[r_range] = thoughts
                for it in citems:
                    it["_thoughts"] = range_map.get(it.get("range", ""), [])
            else:
                for it in citems:
                    it["_thoughts"] = []
        except Exception:
            for it in citems:
                it["_thoughts"] = []

    print("     其中 {} 个章节有划线数据".format(len([c for c, bms in chapters_bookmarks.items() if bms])))

    # 渲染 Markdown
    print("[5/5] 渲染 Markdown → {}".format(args.output))
    md = render_markdown(book_info, chapters, chapters_bookmarks, len(chapters))
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md)

    thought_count = sum(len(item.get("_thoughts", [])) for items_list in chapters_bookmarks.values() for item in items_list)
    print("✅ 完成 · {} 章 · {} 条划线 · {} 条读者思考 · {} chars".format(
        len(chapters), len(items), thought_count, len(md)))
    print("📄 {}".format(args.output))


if __name__ == "__main__":
    main()
