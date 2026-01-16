"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_APPS = void 0;
exports.loadAppsConfig = loadAppsConfig;
exports.openUrl = openUrl;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const os_1 = __importDefault(require("os"));
exports.DEFAULT_APPS = {
    shici: 'https://wealth.want.biz/shici/index.html',
    dict: 'https://wealth.want.biz/pages/dict.html',
    pong: 'https://wealth.want.biz/pages/pong.html'
};
function loadAppsConfig() {
    const configPaths = [
        path_1.default.join(process.cwd(), 'yuangs.config.json'),
        path_1.default.join(process.cwd(), 'yuangs.config.yaml'),
        path_1.default.join(process.cwd(), 'yuangs.config.yml'),
        path_1.default.join(process.cwd(), '.yuangs.json'),
        path_1.default.join(process.cwd(), '.yuangs.yaml'),
        path_1.default.join(process.cwd(), '.yuangs.yml'),
        path_1.default.join(os_1.default.homedir(), '.yuangs.json'),
        path_1.default.join(os_1.default.homedir(), '.yuangs.yaml'),
        path_1.default.join(os_1.default.homedir(), '.yuangs.yml'),
    ];
    for (const configPath of configPaths) {
        if (fs_1.default.existsSync(configPath)) {
            try {
                const configContent = fs_1.default.readFileSync(configPath, 'utf8');
                let config;
                if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
                    config = js_yaml_1.default.load(configContent);
                }
                else {
                    config = JSON.parse(configContent);
                }
                return config.apps || config;
            }
            catch (error) { }
        }
    }
    return exports.DEFAULT_APPS;
}
function openUrl(url) {
    let command;
    switch (process.platform) {
        case 'darwin':
            command = `open "${url}"`;
            break;
        case 'win32':
            command = `start "${url}"`;
            break;
        default:
            command = `xdg-open "${url}"`;
            break;
    }
    (0, child_process_1.exec)(command);
}
//# sourceMappingURL=apps.js.map