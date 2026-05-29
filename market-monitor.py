from js import fetch, Response
import json
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse, parse_qs

# =========================================================
# 使用说明（重要）
# 1) 仅用 Cron 触发：本代码不会在 HTTP 打开时发送消息，HTTP 仅返回健康检查信息。
# 2) 在 wrangler.toml 配置定时任务（UTC）：
#    北京时间 21:00–23:00 => UTC 13:00–15:00
#    北京时间 00:00–16:00 => UTC 16:00–08:00
#    合并：UTC 小时 0–8, 13–23（每小时一次，分=0）
#    [triggers]
#    crons = ["0 0-8,13-23 * * *"]
#    若想延后 5 分钟跑：["5 0-8,13-23 * * *"]
# 3) 如需只在工作日运行，可拆成两条并限定 1-5（周一到周五）：
#    crons = ["0 13-23 * * 1-5", "0 0-8 * * 1-5"]
# =========================================================

# =========================
# 配置
# =========================
# 是否在定时任务中发送到企业微信与 PushDeer
SEND_WEIXIN = True
SEND_PUSHDEER = False  # 若需要同时发 PushDeer，改为 True

# PushDeer（可选；若不用可留空或保持 SEND_PUSHDEER=False）
PUSHDEER_PUSHKEY = "PDU1TNH7QrnWGOb4dXnR74nL24RWwkWMT4qkC"
PUSHDEER_URL = "https://www.889.ink/message/push"

# 企业微信消息网关（你的网关地址）
WEIXINPUSH_URL = "https://api.yuangs.cc/weixinpush"
WEIXINPUSH_TOKEN = "XXXX"

# 数据源（按时段切换）
DAY_URL = "https://q.want.biz/"
NIGHT_URL = "https://q.want.biz/night"

# 详情页
DETAIL_URL = "https://wealth.want.biz/pages/future.html"
DETAIL_URL2 = "https://wealth.want.biz/pages/ygs.html"

# =========================
# 数据获取与处理
# =========================
async def get_east_money_data():
    bj_time = datetime.utcnow() + timedelta(hours=8)
    current_hour = bj_time.hour
    url = DAY_URL if 6 <= current_hour < 18 else NIGHT_URL

    resp = await fetch(url)
    if resp.status != 200:
        raise ValueError("无法获取数据，状态码: " + str(resp.status))
    data = json.loads(await resp.text())
    return data, current_hour

def format_data(data, current_hour):
    if data.get('total') is None or 'list' not in data:
        raise ValueError("获取数据失败或数据格式不正确")

    items = data['list']
    up_items, down_items = [], []

    for item in items:
        try:
            zdf_value = float(item.get('zdf', '0'))
            cje_value = float(item.get('cje', 0))
        except (TypeError, ValueError):
            continue

        # 仅统计成交 > 10亿
        if cje_value > 1_000_000_000:
            if zdf_value > 0:
                up_items.append(item)
            elif zdf_value < 0:
                down_items.append(item)

    up_items = sorted(up_items, key=lambda x: abs(float(x.get('zdf', 0))), reverse=True)
    down_items = sorted(down_items, key=lambda x: abs(float(x.get('zdf', 0))), reverse=True)

    def avg(arr):
        if not arr:
            return 0.0
        total = sum(float(i.get('zdf', 0)) for i in arr)
        return round(total / len(arr), 2)

    overall_up_avg = avg(up_items)
    overall_down_avg = avg(down_items)

    session = "☀️" if 6 <= current_hour < 18 else "🌙"

    def latest_price(it):
        # 统一“最新”字段
        return it.get('p') if it.get('p') is not None else it.get('qrspj')

    formatted = {
        "指标": {
            "session": session,
            "up_n": len(up_items),
            "down_n": len(down_items),
            "up_avg": overall_up_avg,
            "down_avg": abs(overall_down_avg)
        },
        "上涨TOP5": [
            {"合约": it.get('name'), "最新": latest_price(it), "涨幅": it.get('zdf')}
            for it in up_items[:5]
        ],
        "下跌TOP5": [
            {"合约": it.get('name'), "最新": latest_price(it), "跌幅": it.get('zdf')}
            for it in down_items[:5]
        ],
    }
    return formatted

# =========================
# 文本构造
# =========================
def bj_now_title(suffix="涨跌"):
    bj = datetime.utcnow() + timedelta(hours=8)
    return bj.strftime("%m-%d %H:%M ") + suffix

def compact_summary(metrics: dict) -> str:
    s = metrics.get("session", "")
    up_n = metrics.get("up_n", 0)
    down_n = metrics.get("down_n", 0)
    up_avg = metrics.get("up_avg", 0.0)
    down_avg = metrics.get("down_avg", 0.0)
    return f"⬆️{up_n}@+{up_avg:.2f}%{s}{down_n}@-{down_avg:.2f}%⬇️"

def _pct_str(x):
    if x is None:
        return "--"
    s = str(x)
    return s if "%" in s else f"{float(s):.2f}%"

def build_weixin_text_content(formatted):
    # 伪加粗标题：全角方括号
    title = f"【{bj_now_title('概况')}】"
    summary = compact_summary(formatted.get("指标", {}))

    ups = formatted.get("上涨TOP5", [])
    downs = formatted.get("下跌TOP5", [])

    ups_lines = [
        f"{i}. {it.get('合约','--')}｜涨幅 {_pct_str(it.get('涨幅'))}"
        for i, it in enumerate(ups[:5], 1)
    ] or ["无"]

    downs_lines = [
        f"{i}. {it.get('合约','--')}｜跌幅 {_pct_str(it.get('跌幅'))}"
        for i, it in enumerate(downs[:5], 1)
    ] or ["无"]

    return "\n".join([
        summary,
        "",
        "上涨TOP5",
        *ups_lines,
        "",
        "下跌TOP5",
        *downs_lines,
        "",
        f"详情：首页：{DETAIL_URL} 列表{DETAIL_URL2}"
    ])

# =========================
# 发送函数
# =========================
async def send_to_pushdeer(formatted_data, title="市场监控信息"):
    # 若不需要 PushDeer，可不调用
    text = f"{title}"
    desp = json.dumps(formatted_data, ensure_ascii=False, indent=2)
    form = urlencode({"pushkey": PUSHDEER_PUSHKEY, "text": text, "desp": desp, "type": "text"})
    resp = await fetch(
        PUSHDEER_URL, method="POST",
        headers=[("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8")],
        body=form
    )
    # 某些运行时 resp.json() 返回 JS 对象，需 to_py()；做兼容处理
    try:
        js_obj = await resp.json()
        body = js_obj.to_py() if hasattr(js_obj, "to_py") else js_obj
    except Exception:
        body = {"raw": await resp.text()}
    return {"http_status": resp.status, "body": body} 

async def send_to_weixinpush_text(content: str, to_user: str = "@all"):
    payload = {"msgtype": "text", "content": content, "to_user": to_user}
    body = json.dumps(payload, ensure_ascii=False)
    resp = await fetch(
        WEIXINPUSH_URL, method="POST",
        headers=[
            ("Content-Type", "application/json"),
            ("Authorization", f"Bearer {WEIXINPUSH_TOKEN}")
        ],
        body=body
    )
    text = await resp.text()
    try:
        js_obj = json.loads(text)
    except Exception:
        js_obj = {"raw": text}
    if resp.status != 200:
        raise ValueError(f"WeiXinPush HTTP错误: {resp.status}, 响应: {text}")
    return {"http_status": resp.status, "body": js_obj}

# =========================
# 时段校验（北京时间 21:00–次日 16:00） 
# =========================
def in_bjt_window(now_utc=None):
    if now_utc is None:
        now_utc = datetime.utcnow()
    bj = now_utc + timedelta(hours=8)
    h = bj.hour
    return (h >= 20) or (h <= 16)

# =========================
# 定时任务入口（仅 Cron 触发）
# =========================
async def on_scheduled(event):
    try:
        # 保险：即便 Cron 已限制时段，再做一次本地校验
        if not in_bjt_window():
            print("Skip: out of BJT window")
            return

        raw, hour = await get_east_money_data()
        formatted = format_data(raw, hour)
        content = build_weixin_text_content(formatted)

        results = {}
        if SEND_WEIXIN:
            results["weixinpush"] = await send_to_weixinpush_text(content, to_user='@all')
        if SEND_PUSHDEER and PUSHDEER_PUSHKEY:
            results["pushdeer"] = await send_to_pushdeer(formatted, title="苑广山的市场监控（Cron）")

        # 可选：打印日志便于排错
        print("Cron sent:", json.dumps(results, ensure_ascii=False))

    except Exception as e:
        # 生产中建议把异常上报到日志/告警
        print("scheduled error:", e)

# =========================
# HTTP 入口：仅健康检查/预览，不发送
# =========================
async def on_fetch(request):
    # 仅返回提示信息，不触发任何发送
    info = {
        "status": "ok",
        "message": "HTTP 访问不会触发推送。推送由 Cron 定时触发。",
        "hint": "如需恢复为 HTTP 触发，请参考下方已注释的旧逻辑。",
        "now_utc": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "in_bjt_window": in_bjt_window(),
    }
    return Response.new(
        json.dumps(info, ensure_ascii=False),
        {"status": 200, "headers": [("Content-Type", "application/json")]}
    )

# =========================
# 旧的 HTTP 触发逻辑（已整段注释；保留以便随时恢复）
# =========================
"""
# =========================
# 参数解析（旧逻辑）
# =========================
async def parse_request_params(request):
    u = urlparse(str(request.url))
    qs = parse_qs(u.query)
    params = {k: v[0] for k, v in qs.items()}

    req_body = {}
    try:
        t = await request.text()
        if t:
            req_body = json.loads(t)
    except Exception:
        pass

    # 默认为只发企业微信 text（旧逻辑）
    channel = (req_body.get("channel") or params.get("channel") or "weixin").lower()
    to_user = req_body.get("to_user") or params.get("to_user") or "@all"
    return {"channel": channel, "to_user": to_user}

# =========================
# 主流程（旧逻辑）
# =========================
async def handle_main_api(request):
    params = await parse_request_params(request)

    raw, hour = await get_east_money_data()
    formatted = format_data(raw, hour)

    results = {}
    # 如需同时发 PushDeer，可将默认 channel 改为 both，或请求 ?channel=both
    if params["channel"] in ("pushdeer", "both"):
        results["pushdeer"] = await send_to_pushdeer(formatted, title="苑广山的市场监控（Python CF Worker）")

    if params["channel"] in ("weixin", "both"):
        content = build_weixin_text_content(formatted)
        results["weixinpush"] = await send_to_weixinpush_text(content, to_user=params["to_user"])

    resp = {
        "status": "success",
        "message": "Data fetched and pushed",
        "channel": params["channel"],
        "results": results
    }
    return Response.new(json.dumps(resp, ensure_ascii=False),
                        {"status": 200, "headers": [("Content-Type", "application/json")]})

# =========================
# 旧的 HTTP 入口（打开即发）
# =========================
async def handle_request(request):
    try:
        return await handle_main_api(request)
    except Exception as e:
        err = {"status": "error", "message": str(e)}
        return Response.new(json.dumps(err, ensure_ascii=False),
                            {"status": 500, "headers": [("Content-Type", "application/json")]})

async def on_fetch(request):
    # 旧逻辑：打开即发（已禁用）
    return await handle_request(request)
"""
