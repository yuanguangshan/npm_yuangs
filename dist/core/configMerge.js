"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfigAt = loadConfigAt;
exports.mergeConfigs = mergeConfigs;
exports.dumpConfigSnapshot = dumpConfigSnapshot;
exports.getConfigFilePaths = getConfigFilePaths;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function loadConfigAt(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        return null;
    }
    try {
        const content = fs_1.default.readFileSync(filePath, 'utf8');
        if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
            return js_yaml_1.default.load(content);
        }
        return JSON.parse(content);
    }
    catch (error) {
        console.warn(`Failed to load config from ${filePath}:`, error);
        return null;
    }
}
function mergeConfigs(builtin, userGlobal, project, commandOverride) {
    const merged = {};
    const addField = (key, value, source, filePath) => {
        merged[key] = { value, source, filePath };
    };
    Object.entries(builtin).forEach(([key, value]) => {
        addField(key, value, 'built-in');
    });
    if (userGlobal) {
        Object.entries(userGlobal).forEach(([key, value]) => {
            addField(key, value, 'user-global', path_1.default.join(os_1.default.homedir(), '.yuangs.json'));
        });
    }
    if (project) {
        Object.entries(project).forEach(([key, value]) => {
            addField(key, value, 'project');
        });
    }
    if (commandOverride) {
        Object.entries(commandOverride).forEach(([key, value]) => {
            addField(key, value, 'command-override');
        });
    }
    return merged;
}
function dumpConfigSnapshot(config) {
    const output = {};
    Object.entries(config).forEach(([key, field]) => {
        output[key] = {
            value: field.value,
            source: field.source,
            filePath: field.filePath,
        };
    });
    return JSON.stringify(output, null, 2);
}
function findProjectConfig(cwd = process.cwd()) {
    let dir = cwd;
    const configFiles = ['.yuangs.json', '.yuangs.yaml', '.yuangs.yml', 'yuangs.config.json'];
    while (dir && dir !== path_1.default.dirname(dir)) {
        for (const filename of configFiles) {
            const candidate = path_1.default.join(dir, filename);
            if (fs_1.default.existsSync(candidate)) {
                return candidate;
            }
        }
        dir = path_1.default.dirname(dir);
    }
    const root = path_1.default.parse(cwd).root;
    for (const filename of configFiles) {
        const rootCandidate = path_1.default.join(root, filename);
        if (fs_1.default.existsSync(rootCandidate)) {
            return rootCandidate;
        }
    }
    return null;
}
function getConfigFilePaths() {
    return {
        userGlobal: path_1.default.join(os_1.default.homedir(), '.yuangs.json'),
        project: findProjectConfig(),
    };
}
//# sourceMappingURL=configMerge.js.map