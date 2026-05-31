#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信读书精华笔记生成器

给定一本书，获取章节目录、个人划线和想法，按章节整理，
每章精选高质量划线并附上你的思考，输出结构化精华笔记 Markdown。

用法：
  export WEREAD_API_KEY=wrk-xxxxx
  python3 scripts_curated_notes.py --book "三体" --max-per-chapter 15 \
      --output ../outputs/三体_精华笔记_20260530.md

依赖：curl, Python 3.6+
"""
import argparse
import json
import os
import subprocess
import sys
from collections import defaultdict
from datetime import datetime

GATEWAY = "https://i.weread.qq.com/api/agent/gateway"
SKILL_VERSION = "1.0.3"

# 划线颜色 → 质量权重（暖色通常代表用户重点标记）
COLOR_WEIGHT = {
    "red": 25,
    "orange": 22,
    "yellow": 18,
    "pink": 15,
    "purple": 12,
    "green": 8,
    "blue": 5,
}


# ── API 调用 ──────────────────────────────────────────────────────────

def call_api(api_name, **params):
    """通过 curl 调用微信读书 API。参数平铺到 JSON 根，不嵌套。"""
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
        print("[ERR] api errcode=", data.get("errcode"),
              "msg=", data.get("errmsg"), file=sys.stderr)
        return None
    return data


# ── 数据获取 ──────────────────────────────────────────────────────────

def resolve_book(book_input):
    """从书名或 bookId 解析出 bookId 和书籍信息。"""
    # 先尝试直接作为 bookId
    data = call_api("/book/info", bookId=book_input)
    if data and data.get("title"):
        return data.get("bookId"), data

    # 搜索书名
    data = call_api("/store/search", keyword=book_input, scope=10, count=5)
    if not data:
        return None, None
    results = data.get("results") or []
    for group in results:
        gscope = group.get("scope")
        if gscope not in (10, 17):
            continue
        books = group.get("books") or []
        if not books:
            continue
        bi = books[0].get("bookInfo", {})
        bid = bi.get("bookId")
        if not bid:
            continue
        detail = call_api("/book/info", bookId=bid)
        return bid, detail or bi
    return None, None


def get_chapters(book_id):
    """获取章节目录。"""
    data = call_api("/book/chapterinfo", bookId=book_id)
    if not data:
        return []
    return data.get("chapters") or []


def get_user_bookmarks(book_id):
    """获取用户的所有划线，按 chapterUid 分组。"""
    data = call_api("/book/bookmarklist", bookId=book_id)
    if not data:
        return {}, {}

    updated = data.get("updated") or []
    # 构建章节映射
    chapters_map = {}
    for ch in data.get("chapters") or []:
        chapters_map[ch.get("chapterUid")] = ch.get("title", "")

    grouped = defaultdict(list)
    for bm in updated:
        cu = bm.get("chapterUid") or 0
        bm["_chapterTitle"] = chapters_map.get(cu, "")
        # 只保留有原文内容的划线
        if (bm.get("markText") or "").strip():
            grouped[cu].append(bm)

    return dict(grouped), chapters_map


def get_user_thoughts(book_id):
    """获取用户的所有想法/点评，按章节名分组。"""
    all_thoughts = []
    synckey = 0
    while True:
        data = call_api("/review/list/mine", bookid=book_id, synckey=synckey, count=50)
        if not data:
            break
        items = data.get("reviews") or []
        for item in items:
            r = item.get("review", {})
            content = (r.get("content") or "").strip()
            if len(content) < 10:
                continue  # 过滤无实质内容的
            all_thoughts.append({
                "content": content,
                "createTime": r.get("createTime", 0),
                "star": r.get("star"),
                "chapterName": (r.get("chapterName") or "").strip(),
                "isFinish": r.get("isFinish", False),
            })
        if not data.get("hasMore"):
            break
        synckey = data.get("synckey", 0)

    grouped = defaultdict(list)
    for t in all_thoughts:
        key = t["chapterName"] or "__整本书评__"
        grouped[key].append(t)
    return dict(grouped)


# ── 质量评分与筛选 ────────────────────────────────────────────────────

def chapter_title_from_cuid(cuid, chapters_map):
    """根据 chapterUid 获取章节标题。"""
    return chapters_map.get(cuid, "")


def thought_matches_chapter(thought_chapter, target_titles):
    """判断一条想法是否属于目标章节（模糊匹配标题）。"""
    tc = thought_chapter.strip()
    for t in target_titles:
        if not t:
            continue
        if tc == t or tc in t or t in tc:
            return True
    return False


def score_bookmark(bm, chapter_thoughts, chapters_map):
    """对单条划线进行质量打分，用于排序筛选。

    加分维度：
      - 有用户思考想法（最高权重）
      - 暖色标记（红色/橙色 → 重点）
      - 原文长度适中（30-200 字最有价值）
      - 较新近的划线
    """
    score = 10  # 基础分

    # 颜色权重
    color = bm.get("colorStyle", "")
    if color:
        score += COLOR_WEIGHT.get(color, 3)

    # 文本长度
    text = (bm.get("markText") or "").strip()
    length = len(text)
    if 30 <= length <= 200:
        score += 15
    elif 15 <= length < 30:
        score += 5
    elif length < 15:
        score -= 5
    # 超过200字的不加分也不减分，有的段落本身长

    # 有匹配思考想法 → 强信号
    cuid = bm.get("chapterUid") or 0
    ch_title = chapter_title_from_cuid(cuid, chapters_map)
    for th_ch, th_list in chapter_thoughts.items():
        if thought_matches_chapter(th_ch, [ch_title]):
            score += 30
            break

    # 新近度加分（30天内）
    create_time = bm.get("createTime") or 0
    if create_time:
        days_ago = (datetime.now() - datetime.fromtimestamp(create_time)).days
        if days_ago <= 30:
            score += 8
        elif days_ago <= 90:
            score += 4
        elif days_ago <= 365:
            score += 2

    return score


def select_top_bookmarks(bookmarks, chapter_thoughts, chapters_map, max_n):
    """从一章的划线圈中选出 top N 条高质量划线。"""
    scored = [(score_bookmark(bm, chapter_thoughts, chapters_map), bm) for bm in bookmarks]
    scored.sort(key=lambda x: -x[0])
    return [bm for _, bm in scored[:max_n]]


def find_matching_thoughts(chapter_thoughts, ch_title):
    """找到匹配该章节标题的用户想法列表，按内容长度降序。"""
    matched = []
    for th_ch, th_list in chapter_thoughts.items():
        if thought_matches_chapter(th_ch, [ch_title, *ch_title.split("·")]):
            matched.extend(th_list)
    matched.sort(key=lambda t: -len(t.get("content", "")))
    return matched


# ── 渲染输出 ──────────────────────────────────────────────────────────

def format_timestamp(ts):
    if not ts:
        return ""
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")


def star_to_stars(star_val):
    """将 -1/0-5 评分转为星星文本。"""
    if star_val is None or star_val < 1:
        return ""
    return "⭐" * int(star_val)


def render_markdown(book_info, chapters, bm_by_cuid, chapters_map, thoughts_by_ch, max_per_chapter):
    """生成精华笔记 Markdown。"""
    title = book_info.get("title", "未知")
    author = book_info.get("author", "")
    cover = book_info.get("cover", "")
    intro = (book_info.get("intro") or "").strip()

    lines = []
    lines.append(f"# 《{title}》精华笔记")
    lines.append("")
    meta = []
    if author:
        meta.append(f"**作者**：{author}")
    meta.append("**来源**：微信读书")
    lines.append("> " + " · ".join(meta))
    if intro:
        lines.append(f"> **简介**：{intro[:200]}……" if len(intro) > 200 else f"> **简介**：{intro}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # 只处理一级章节作为骨架，若没有则用全部
    top_chapters = [ch for ch in chapters if ch.get("level") == 1]
    if not top_chapters:
        top_chapters = chapters

    total_bookmarks_used = 0

    for idx, ch in enumerate(top_chapters, 1):
        cuid = ch.get("chapterUid")
        ch_title = ch.get("title", f"第 {idx} 章")
        ch_word_count = ch.get("wordCount", 0)

        lines.append(f"## {idx}. {ch_title}")
        if ch_word_count:
            lines.append(f"> 本章约 {ch_word_count} 字")
        lines.append("")

        # 获取本章划线
        chapter_bookmarks = bm_by_cuid.get(cuid, [])
        if not chapter_bookmarks:
            lines.append("_本章暂无你的划线。_")
            lines.append("")
            lines.append("---")
            lines.append("")
            continue

        # 选出高质量划线
        selected = select_top_bookmarks(
            chapter_bookmarks, thoughts_by_ch, chapters_map, max_per_chapter
        )
        if not selected:
            lines.append("_本章暂无可选高质量划线。_")
            lines.append("")
            lines.append("---")
            lines.append("")
            continue

        total_bookmarks_used += len(selected)

        # 获取本章匹配想法
        matched_thoughts = find_matching_thoughts(thoughts_by_ch, ch_title)
        # 为每条划线分配想法：按需取用
        thought_pool = list(matched_thoughts)  # 已按长度降序

        for bi, bm in enumerate(selected, 1):
            text = (bm.get("markText") or "").strip()
            if not text:
                continue

            created = format_timestamp(bm.get("createTime"))
            color = bm.get("colorStyle", "")

            # 划线序号和原文
            lines.append(f"##### 划线 {bi}")
            # 原文用引用块，分段保留
            for para in text.splitlines():
                if para.strip():
                    lines.append(f"> {para.strip()}")
                else:
                    lines.append(">")
            # 元信息行
            meta_parts = []
            if color:
                emoji_map = {"red": "🔴", "orange": "🟠", "yellow": "🟡",
                             "green": "🟢", "blue": "🔵", "purple": "🟣", "pink": "🩷"}
                meta_parts.append(emoji_map.get(color, "📌"))
            if created:
                meta_parts.append(created)
            if meta_parts:
                lines.append(f">  —— {' · '.join(meta_parts)}")
            lines.append("")

            # 尝试分配一条想法到这条划线下
            if thought_pool:
                thought = thought_pool.pop(0)
                tc = thought.get("content", "")
                ts = format_timestamp(thought.get("createTime"))
                stars = star_to_stars(thought.get("star"))
                if tc:
                    thought_lines = tc.splitlines()
                    lines.append(f"> 💭 **我的思考**{f' {stars}' if stars else ''}")
                    for tl in thought_lines:
                        if tl.strip():
                            lines.append(f"> {tl.strip()}")
                    if ts:
                        lines.append(f"> 📅 {ts}")
                    lines.append("")

        # 如果还有多余想法没分配到划线，集中展示
        if thought_pool:
            lines.append("##### 📝 本章其他想法")
            lines.append("")
            for thought in thought_pool[:5]:  # 最多展示 5 条
                tc = thought.get("content", "")
                ts = format_timestamp(thought.get("createTime"))
                stars = star_to_stars(thought.get("star"))
                if tc:
                    lines.append(f"> 💭 {tc} {stars or ''}")
                    if ts:
                        lines.append(f"> 📅 {ts}")
                    lines.append("")

        lines.append("---")
        lines.append("")

    # 如果有章节没有被 level=1 覆盖的划线（比如落到了子章节），补充展示
    all_top_cuids = {ch.get("chapterUid") for ch in top_chapters}
    for cuid, bms in bm_by_cuid.items():
        if cuid in all_top_cuids or not bms:
            continue
        ch_title = chapters_map.get(cuid, f"其他章节 (UID: {cuid})")
        # 只在没被覆盖时展示
        lines.append(f"## {ch_title}")
        lines.append("")
        selected = select_top_bookmarks(bms, thoughts_by_ch, chapters_map, max_per_chapter)
        if not selected:
            continue
        total_bookmarks_used += len(selected)
        for bi, bm in enumerate(selected, 1):
            text = (bm.get("markText") or "").strip()
            if not text:
                continue
            created = format_timestamp(bm.get("createTime"))
            lines.append(f"##### 划线 {bi}")
            for para in text.splitlines():
                if para.strip():
                    lines.append(f"> {para.strip()}")
                else:
                    lines.append(">")
            if created:
                lines.append(f">  —— {created}")
            lines.append("")
        lines.append("---")
        lines.append("")

    # 统计信息尾注
    all_bm_count = sum(len(v) for v in bm_by_cuid.values())
    all_th_count = sum(len(v) for v in thoughts_by_ch.values())
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"📊 **统计**：全书共 {len(top_chapters)} 章 · "
                 f"你共标注 {all_bm_count} 条划线 · "
                 f"精选 {total_bookmarks_used} 条 · "
                 f"写下 {all_th_count} 条想法")
    lines.append("")
    lines.append(f"_由 weread-curated-notes 自动生成 · 数据来源：微信读书_")

    return "\n".join(lines)


# ── 主流程 ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="微信读书精华笔记生成器")
    parser.add_argument("--book", required=True, help="书名或 bookId")
    parser.add_argument("--max-per-chapter", type=int, default=15,
                        help="每章最多展示划线数，默认 15，范围 5-30")
    parser.add_argument("--output", required=True, help="输出 Markdown 路径")
    args = parser.parse_args()

    # 校验参数
    max_n = max(5, min(30, args.max_per_chapter))

    print(f"[1/5] 📖 解析书籍: {args.book}")
    book_id, book_info = resolve_book(args.book)
    if not book_id:
        print("[FATAL] ❌ 找不到这本书", file=sys.stderr)
        sys.exit(3)
    title = book_info.get("title", "未知")
    author = book_info.get("author", "未知")
    print(f"  → ✅ 《{title}》{author} (bookId: {book_id})")

    print("[2/5] 📑 获取章节目录...")
    chapters = get_chapters(book_id)
    print(f"  → {len(chapters)} 个章节")
    if not chapters:
        print("[FATAL] ❌ 无章节数据，可能这本书没有公开目录", file=sys.stderr)
        sys.exit(4)

    print("[3/5] ✏️ 获取你的划线...")
    bm_by_cuid, chapters_map = get_user_bookmarks(book_id)
    total_bm = sum(len(v) for v in bm_by_cuid.values())
    print(f"  → {total_bm} 条划线，分布在 {len(bm_by_cuid)} 个章节")
    if total_bm == 0:
        print("[FATAL] ❌ 你对这本书还没有划线，无法生成精华笔记", file=sys.stderr)
        sys.exit(5)

    print("[4/5] 💭 获取你的想法...")
    thoughts_by_ch = get_user_thoughts(book_id)
    total_th = sum(len(v) for v in thoughts_by_ch.values())
    print(f"  → {total_th} 条有实质内容的思考")

    print(f"[5/5] 📝 生成精华笔记 (每章最多 {max_n} 条)...")
    md = render_markdown(book_info, chapters, bm_by_cuid,
                         chapters_map, thoughts_by_ch, max_n)

    out_dir = os.path.dirname(args.output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(md)

    print(f"\n✅ 完成！{len(md)} 字符 → {args.output}")
    print(f"   精选 {sum(1 for l in md.splitlines() if l.startswith('> **划线'))} 条划线")


if __name__ == "__main__":
    main()
