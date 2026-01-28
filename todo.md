我对个人页面不满意，帮我讨论优化：<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>苑广山项目列表 - 投资与教育资源导航</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            color: white;
            padding: 40px 20px;
            margin-bottom: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .category-section {
            margin-bottom: 50px;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        }

        .category-header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
        }

        .category-icon {
            font-size: 2.5em;
            margin-right: 15px;
        }

        .category-title {
            font-size: 2em;
            color: #333;
            font-weight: 600;
        }

        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .project-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            padding: 25px;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            border: 2px solid transparent;
        }

        .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
            border-color: #667eea;
        }

        .project-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        }

        .project-card:hover::before {
            left: 100%;
        }

        .project-number {
            display: inline-block;
            background: #667eea;
            color: white;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            text-align: center;
            line-height: 35px;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 0.9em;
        }

        .project-title {
            font-size: 1.3em;
            color: #2d3748;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .project-description {
            color: #4a5568;
            font-size: 0.95em;
            margin-bottom: 15px;
            line-height: 1.5;
        }

        .project-link {
            display: inline-block;
            color: #667eea;
            text-decoration: none;
            font-size: 0.85em;
            word-break: break-all;
            padding: 8px 12px;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 8px;
            transition: all 0.3s;
        }

        .project-link:hover {
            background: #667eea;
            color: white;
        }

        .featured-badge {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #f56565;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.75em;
            font-weight: bold;
        }

        footer {
            text-align: center;
            color: white;
            padding: 30px;
            margin-top: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 1.8em;
            }

            .subtitle {
                font-size: 1em;
            }

            .projects-grid {
                grid-template-columns: 1fr;
            }

            .category-title {
                font-size: 1.5em;
            }

            .category-section {
                padding: 20px;
            }
        }

        .stats-bar {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 30px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 15px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-number {
            font-size: 2em;
            font-weight: bold;
            display: block;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌟 苑广山项目列表 🌟</h1>
            <p class="subtitle">投资工具 · 数据分析 · 教育资源 · 开发工具</p>
            <div class="stats-bar">
                <div class="stat-item">
                    <span class="stat-number">25+</span>
                    <span class="stat-label">投资工具</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">22+</span>
                    <span class="stat-label">教育资源</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">3</span>
                    <span class="stat-label">超复杂项目</span>
                </div>
            </div>
        </header>

        <!-- 投资相关 -->
        <section class="category-section">
            <div class="category-header">
                <span class="category-icon">📊</span>
                <h2 class="category-title">投资相关工具</h2>
            </div>
            <div class="projects-grid">
                <div class="project-card" onclick="window.open('https://i.want.biz/', '_blank')">
                    <span class="featured-badge">⭐ 推荐</span>
                    <div class="project-number">1</div>
                    <h3 class="project-title">苑广山的个人空间</h3>
                    <p class="project-description">期货概览，热图、龙虎榜、统计，基差等综合应用</p>
                    <a href="https://i.want.biz/" class="project-link" onclick="event.stopPropagation()">https://i.want.biz/</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/future.html', '_blank')">
                    <span class="featured-badge">🔥 热门</span>
                    <div class="project-number">2</div>
                    <h3 class="project-title">期市概览</h3>
                    <p class="project-description">品种涨跌，增仓比，详细龙虎榜、升贴水</p>
                    <a href="https://wealth.want.biz/v1/future.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/future.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/longshort.html', '_blank')">
                    <div class="project-number">3</div>
                    <h3 class="project-title">龙虎榜</h3>
                    <p class="project-description">龙虎榜、品种净仓观察、持仓量、持仓额、机构持仓等</p>
                    <a href="https://wealth.want.biz/v1/longshort.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/longshort.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/onlist.html', '_blank')">
                    <div class="project-number">4</div>
                    <h3 class="project-title">机构上榜次数</h3>
                    <p class="project-description">期货公司龙虎榜上榜次数统计</p>
                    <a href="https://wealth.want.biz/v1/onlist.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/onlist.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/ths_trading.html?variety=IF&company=%E4%B8%9C%E8%AF%81%E6%9C%9F%E8%B4%A7(%E4%BB%A3%E5%AE%A2)&contract=ALL', '_blank')">
                    <div class="project-number">5</div>
                    <h3 class="project-title">期货公司建仓过程</h3>
                    <p class="project-description">同花顺、盈亏明细，建仓过程</p>
                    <a href="https://wealth.want.biz/v1/ths_trading.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/ths_trading.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/gp.html', '_blank')">
                    <div class="project-number">6</div>
                    <h3 class="project-title">股票数据分析中心</h3>
                    <p class="project-description">沪深融资、行业融资、股票异动</p>
                    <a href="https://wealth.want.biz/pages/gp.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/gp.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/ygs.html', '_blank')">
                    <div class="project-number">7</div>
                    <h3 class="project-title">期货行情（图表监控）</h3>
                    <p class="project-description">期市实时监控，涨幅汇总，成交与沉淀资金</p>
                    <a href="https://wealth.want.biz/pages/ygs.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/ygs.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/k.html', '_blank')">
                    <div class="project-number">8</div>
                    <h3 class="project-title">期货行情（K线监控）</h3>
                    <p class="project-description">期货品种实时监控，自定义指标设置</p>
                    <a href="https://wealth.want.biz/pages/k.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/k.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/etf.html?vol=10', '_blank')">
                    <div class="project-number">9</div>
                    <h3 class="project-title">ETF概览</h3>
                    <p class="project-description">ETF概览、指数类规模统计</p>
                    <a href="https://wealth.want.biz/pages/etf.html?vol=10" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/etf.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/f.html', '_blank')">
                    <div class="project-number">10</div>
                    <h3 class="project-title">期货月间结构</h3>
                    <p class="project-description">期货合约列表，价格数据，品种结构</p>
                    <a href="https://wealth.want.biz/pages/f.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/f.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/zf.html', '_blank')">
                    <div class="project-number">11</div>
                    <h3 class="project-title">周期涨跌对比</h3>
                    <p class="project-description">不同周期的涨跌幅对比</p>
                    <a href="https://wealth.want.biz/pages/zf.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/zf.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/zdt.html', '_blank')">
                    <div class="project-number">12</div>
                    <h3 class="project-title">品种涨跌停</h3>
                    <p class="project-description">期货品种涨跌停监控</p>
                    <a href="https://wealth.want.biz/pages/zdt.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/zdt.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/qhhq.html', '_blank')">
                    <div class="project-number">13</div>
                    <h3 class="project-title">期货外盘行情</h3>
                    <p class="project-description">华尔街见闻外盘期货行情</p>
                    <a href="https://wealth.want.biz/pages/qhhq.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/qhhq.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/yd.html', '_blank')">
                    <div class="project-number">14</div>
                    <h3 class="project-title">股票异动</h3>
                    <p class="project-description">股票市场异动监控</p>
                    <a href="https://wealth.want.biz/pages/yd.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/yd.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://i.want.biz/market-analysis', '_blank')">
                    <div class="project-number">15</div>
                    <h3 class="project-title">市场智能分析</h3>
                    <p class="project-description">AI驱动的市场数据智能分析</p>
                    <a href="https://i.want.biz/market-analysis" class="project-link" onclick="event.stopPropagation()">i.want.biz/market-analysis</a>
                </div>

                <div class="project-card" onclick="window.open('https://i.want.biz/ths-basis', '_blank')">
                    <div class="project-number">16</div>
                    <h3 class="project-title">期货基差</h3>
                    <p class="project-description">期货基差数据分析</p>
                    <a href="https://i.want.biz/ths-basis" class="project-link" onclick="event.stopPropagation()">i.want.biz/ths-basis</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/rzrq.html', '_blank')">
                    <div class="project-number">17</div>
                    <h3 class="project-title">股票融资</h3>
                    <p class="project-description">股票融资融券数据</p>
                    <a href="https://wealth.want.biz/pages/rzrq.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/rzrq.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/qdii.html', '_blank')">
                    <div class="project-number">18</div>
                    <h3 class="project-title">T+0 ETF</h3>
                    <p class="project-description">T+0交易ETF数据监控</p>
                    <a href="https://wealth.want.biz/pages/qdii.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/qdii.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/companyholding.html', '_blank')">
                    <div class="project-number">19</div>
                    <h3 class="project-title">期货机构盈亏</h3>
                    <p class="project-description">期货机构持仓盈亏分析</p>
                    <a href="https://wealth.want.biz/v1/companyholding.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/companyholding.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/profit.html', '_blank')">
                    <div class="project-number">20</div>
                    <h3 class="project-title">期货品种盈亏</h3>
                    <p class="project-description">期货品种盈亏统计分析</p>
                    <a href="https://wealth.want.biz/v1/profit.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/profit.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/gg.html', '_blank')">
                    <div class="project-number">21</div>
                    <h3 class="project-title">收盘价与净融资</h3>
                    <p class="project-description">股票收盘价与净融资关系分析</p>
                    <a href="https://wealth.want.biz/pages/gg.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/gg.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/api.html', '_blank')">
                    <div class="project-number">22</div>
                    <h3 class="project-title">极智量化API</h3>
                    <p class="project-description">量化交易API接口文档</p>
                    <a href="https://wealth.want.biz/pages/api.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/api.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/ratio.html', '_blank')">
                    <div class="project-number">23</div>
                    <h3 class="project-title">期货合约交易与资金系数</h3>
                    <p class="project-description">期货合约资金系数计算</p>
                    <a href="https://wealth.want.biz/pages/ratio.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/ratio.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/tools.html', '_blank')">
                    <div class="project-number">24</div>
                    <h3 class="project-title">投资工具集</h3>
                    <p class="project-description">综合投资工具箱</p>
                    <a href="https://wealth.want.biz/pages/tools.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/tools.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/tool.html', '_blank')">
                    <div class="project-number">25</div>
                    <h3 class="project-title">投资工具集2</h3>
                    <p class="project-description">更多投资分析工具</p>
                    <a href="https://wealth.want.biz/pages/tool.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/tool.html</a>
                </div>
            </div>
        </section>

        <!-- 教育相关 -->
        <section class="category-section">
            <div class="category-header">
                <span class="category-icon">📚</span>
                <h2 class="category-title">教育相关资源</h2>
            </div>
            <div class="projects-grid">
                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/course.html', '_blank')">
                    <div class="project-number">1</div>
                    <h3 class="project-title">计算机课程</h3>
                    <p class="project-description">编程与计算机科学学习资源</p>
                    <a href="https://wealth.want.biz/pages/course.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/course.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/yiyan.html', '_blank')">
                    <div class="project-number">2</div>
                    <h3 class="project-title">一言</h3>
                    <p class="project-description">每日一言，汲取智慧</p>
                    <a href="https://wealth.want.biz/pages/yiyan.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/yiyan.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/music.html', '_blank')">
                    <div class="project-number">3</div>
                    <h3 class="project-title">古典音乐新手指南</h3>
                    <p class="project-description">古典音乐入门与鉴赏</p>
                    <a href="https://wealth.want.biz/pages/music.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/music.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/musiclist.html', '_blank')">
                    <div class="project-number">4</div>
                    <h3 class="project-title">古典音乐大全</h3>
                    <p class="project-description">完整的古典音乐作品列表</p>
                    <a href="https://wealth.want.biz/pages/musiclist.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/musiclist.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/kerry/games.html', '_blank')">
                    <div class="project-number">5</div>
                    <h3 class="project-title">Kerry游戏中心</h3>
                    <p class="project-description">趣味教育小游戏合集</p>
                    <a href="https://wealth.want.biz/pages/kerry/games.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/kerry/games.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/earth.html', '_blank')">
                    <div class="project-number">6</div>
                    <h3 class="project-title">地球纪元及年代划分</h3>
                    <p class="project-description">地质年代与地球历史</p>
                    <a href="https://wealth.want.biz/pages/earth.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/earth.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/pong.html', '_blank')">
                    <div class="project-number">7</div>
                    <h3 class="project-title">经典游戏 Pong</h3>
                    <p class="project-description">复古乒乓球游戏</p>
                    <a href="https://wealth.want.biz/pages/pong.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/pong.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/color.html', '_blank')">
                    <div class="project-number">8</div>
                    <h3 class="project-title">颜色工具</h3>
                    <p class="project-description">颜色选择与配色工具</p>
                    <a href="https://wealth.want.biz/pages/color.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/color.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://github.com/yuanguangshan/ygs/blob/main/learning/taio/dictionary.js', '_blank')">
                    <div class="project-number">9</div>
                    <h3 class="project-title">jsbox词典（iPhone）</h3>
                    <p class="project-description">iOS平台JSBox词典脚本</p>
                    <a href="https://github.com/yuanguangshan/ygs" class="project-link" onclick="event.stopPropagation()">github.com/yuanguangshan/ygs</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/jsbox_document.md', '_blank')">
                    <div class="project-number">10</div>
                    <h3 class="project-title">jsbox文档</h3>
                    <p class="project-description">JSBox开发文档</p>
                    <a href="https://wealth.want.biz/pages/jsbox_document.md" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/jsbox_document.md</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/moon.html', '_blank')">
                    <div class="project-number">11</div>
                    <h3 class="project-title">月相变化</h3>
                    <p class="project-description">月球相位变化演示</p>
                    <a href="https://wealth.want.biz/pages/moon.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/moon.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/planets.html', '_blank')">
                    <div class="project-number">12</div>
                    <h3 class="project-title">太阳系八大行星演示</h3>
                    <p class="project-description">太阳系行星运行动画</p>
                    <a href="https://wealth.want.biz/pages/sun.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/sun.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/dict.html', '_blank')">
                    <div class="project-number">13</div>
                    <h3 class="project-title">在线词典</h3>
                    <p class="project-description">便捷的在线查词工具</p>
                    <a href="https://wealth.want.biz/pages/dict.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/dict.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/beautify.html', '_blank')">
                    <div class="project-number">14</div>
                    <h3 class="project-title">文本一键美化</h3>
                    <p class="project-description">文本格式化与美化工具</p>
                    <a href="https://wealth.want.biz/pages/beautify.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/beautify.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/alarm.html', '_blank')">
                    <div class="project-number">15</div>
                    <h3 class="project-title">北极熊闹钟</h3>
                    <p class="project-description">可爱的在线闹钟应用</p>
                    <a href="https://wealth.want.biz/pages/alarm.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/alarm.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/bmi.html', '_blank')">
                    <div class="project-number">16</div>
                    <h3 class="project-title">BMI计算器</h3>
                    <p class="project-description">身体质量指数计算工具</p>
                    <a href="https://wealth.want.biz/pages/BMI.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/BMI.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://tool.want.biz/token-generator', '_blank')">
                    <div class="project-number">17</div>
                    <h3 class="project-title">编程开发工具</h3>
                    <p class="project-description">Token生成器等开发工具</p>
                    <a href="https://tool.want.biz/token-generator" class="project-link" onclick="event.stopPropagation()">tool.want.biz/token-generator</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/chats.html', '_blank')">
                    <div class="project-number">18</div>
                    <h3 class="project-title">实时聊天室系统架构图</h3>
                    <p class="project-description">聊天系统技术架构展示</p>
                    <a href="https://wealth.want.biz/pages/chats.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/chats.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/code2market.html', '_blank')">
                    <div class="project-number">19</div>
                    <h3 class="project-title">品种代码映射表</h3>
                    <p class="project-description">主力合约品种代码 → 交易所映射</p>
                    <a href="https://wealth.want.biz/pages/code2market.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/code2market.html</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/scratch.md', '_blank')">
                    <div class="project-number">20</div>
                    <h3 class="project-title">Scratch教程</h3>
                    <p class="project-description">儿童编程Scratch学习教程</p>
                    <a href="https://wealth.want.biz/pages/scratch.md" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/scratch.md</a>
                </div>
                <div class="project-card" onclick="window.open('https://wealth.want.biz/express/index.html', '_blank')">
                    <div class="project-number">21</div>
                    <h3 class="project-title">express练手项目</h3>
                    <p class="project-description">express练手项目</p>
                    <a href="https://wealth.want.biz/express/index.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/express/index.html</a>
                </div>
          

                <div class="project-card" onclick="window.open('https://wealth.want.biz/index.html', '_blank')">
                    <div class="project-number">22</div>
                    <h3 class="project-title">苑广山宇宙空间站</h3>
                    <p class="project-description">创意主页与项目导航</p>
                    <a href="https://wealth.want.biz/index.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/index.html</a>
                </div>
            </div>
        </section>

        <!-- 超复杂项目 -->
        <section class="category-section">
            <div class="category-header">
                <span class="category-icon">🚀</span>
                <h2 class="category-title">超复杂项目</h2>
            </div>
            <div class="projects-grid">
                <div class="project-card" onclick="window.open('https://chat.want.biz/test', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">1</div>
                    <h3 class="project-title">全球聊天室</h3>
                    <p class="project-description">实时在线聊天系统，支持全球用户互动</p>
                    <a href="https://chat.want.biz/test" class="project-link" onclick="event.stopPropagation()">chat.want.biz/test</a>
                </div>

                <div class="project-card" onclick="window.open('https://i.want.biz/', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">2</div>
                    <h3 class="project-title">苑广山的个人空间</h3>
                    <p class="project-description">期货概览，热图、龙虎榜、统计，基差等综合应用</p>
                    <a href="https://i.want.biz/" class="project-link" onclick="event.stopPropagation()">i.want.biz/</a>
                </div>

                <div class="project-card" onclick="window.open('https://wealth.want.biz/v1/future.html', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">3</div>
                    <h3 class="project-title">期市概览</h3>
                    <p class="project-description">品种涨跌，增仓比，详细龙虎榜、升贴水</p>
                    <a href="https://wealth.want.biz/v1/future.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/v1/future.html</a>
                </div>
        
            
                <div class="project-card" onclick="window.open('https://wealth.want.biz/music/index.html', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">4</div>
                    <h3 class="project-title">广山音乐</h3>
                    <p class="project-description">苹果、youtube两大乐源，畅听全球高品质音乐！</p>
                    <a href="https://wealth.want.biz/music/index.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/music/index.html</a>
                </div>
      
                    <div class="project-card" onclick="window.open('https://todo.want.biz/', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">5</div>
                    <h3 class="project-title">苑广山待办事项</h3>
                    <p class="project-description">管理个人待办事项，各端同步！</p>
                    <a href="https://todo.want.biz" class="project-link" onclick="event.stopPropagation()">todo.want.biz</a>
                </div>
        
                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/poem.html', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">6</div>
                    <h3 class="project-title">唐诗宋词</h3>
                    <p class="project-description">品味千年文化，感受诗词之美！</p>
                    <a href="https://wealth.want.biz/pages/poem.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/poem.html</a>
                </div>
                <div class="project-card" onclick="window.open('https://poe.want.biz', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">6</div>
                    <h3 class="project-title">POE大模型</h3>
                    <p class="project-description">POE接口自己实现，流式响应！</p>
                    <a href="https://poe.want.biz" class="project-link" onclick="event.stopPropagation()">poe.want.biz</a>
                </div>
                <div class="project-card" onclick="window.open('https://wealth.want.biz/pages/ai.html', '_blank')">
                    <span class="featured-badge">💎 精品</span>
                    <div class="project-number">6</div>
                    <h3 class="project-title">AI监控</h3>
                    <p class="project-description">AI监控！</p>
                    <a href="https://wealth.want.biz/pages/ai.html" class="project-link" onclick="event.stopPropagation()">wealth.want.biz/pages/ai.html</a>
                </div>
            </div>
                  </div>
        </section>

        <footer>
            <p style="font-size: 1.2em; margin-bottom: 10px;">🌟 探索更多可能 🌟</p>
            <p>© 2025 苑广山项目集 | 持续更新中</p>
            <p style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">投资有风险，决策需谨慎</p>
        </footer>
    </div>
</body>
</html>