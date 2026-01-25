"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Replayer = void 0;
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
/**
 * 回放器
 */
class Replayer {
    filePath;
    frames = [];
    header;
    speed = 1.0;
    constructor(filePath) {
        this.filePath = filePath;
    }
    /**
     * 加载录像文件
     */
    async load() {
        const fileStream = fs.createReadStream(this.filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        let isFirstLine = true;
        for await (const line of rl) {
            if (!line.trim())
                continue;
            if (isFirstLine) {
                try {
                    this.header = JSON.parse(line);
                    isFirstLine = false;
                }
                catch (e) {
                    console.error('Invalid header format');
                    throw e;
                }
            }
            else {
                try {
                    const frame = JSON.parse(line);
                    this.frames.push(frame);
                }
                catch (e) {
                    // ignore corrupted lines
                }
            }
        }
    }
    /**
     * 播放
     */
    async play(speed = 1.0) {
        this.speed = speed;
        if (!this.header || this.frames.length === 0) {
            console.log('📼 Empty or invalid recording.');
            return;
        }
        console.log(`\n📼 Playing: ${this.header.title}`);
        console.log(`⏱️  Duration: ${this.frames[this.frames.length - 1][0].toFixed(2)}s`);
        console.log(`⏩ Speed: ${this.speed}x`);
        console.log('--------------------------------------------------\n');
        // 这种简单的 sleep 实现可能会有漂移，但对于 MVP 足够了
        // 更精准的实现应该基于 Date.now() 动态计算下一次 sleep 时间
        let lastTime = 0;
        for (const frame of this.frames) {
            const [time, type, data, meta] = frame;
            // 计算需要等待的时间 (ms)
            const delay = (time - lastTime) * 1000 / this.speed;
            if (delay > 10) {
                await this.sleep(delay);
            }
            this.renderFrame(frame);
            lastTime = time;
        }
        console.log('\n\n--------------------------------------------------');
        console.log('✅ End of playback');
    }
    renderFrame(frame) {
        const [_, type, data, meta] = frame;
        if (type === 'o') {
            // 核心: 将捕获的 PTY 输出原样写入 stdout
            process.stdout.write(data);
        }
        else if (type === 'g') {
            // 治理事件可视化
            // 使用 ANSI 颜色在输出流中插入醒目的提示，或者仅仅打印在 stderr 以免破坏布局
            // 为了不破坏 terminal UI (比如 vim 界面)，最好不要直接插入 stdout
            // 这里作为 MVP，我们简单地用一种特殊的颜色打印
            /*
            console.log(`\n\x1b[33m[GOVERNANCE EVENT]: ${data} ${JSON.stringify(meta)}\x1b[0m`);
            */
            // 实际上，如果在 running app (vim/htop) 中插入 log 会导致花屏
            // 更好的做法是 overlay，但 CLI 做不到
            // 暂时策略: 只 log 到 stderr，或者忽略
        }
        else if (type === 'r') {
            // Resize event
            // 尝试 resize 终端? 通常不行。
            // 可以显示提示
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.Replayer = Replayer;
//# sourceMappingURL=Replayer.js.map