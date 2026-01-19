"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePathSuggestions = resolvePathSuggestions;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function resolvePathSuggestions(input, kind) {
    const cwd = process.cwd();
    const normalized = input.replace(/^~(?=$|\/)/, process.env.HOME || '');
    const isDirInput = normalized.endsWith(path_1.default.sep);
    const baseDir = isDirInput
        ? path_1.default.resolve(cwd, normalized)
        : path_1.default.resolve(cwd, path_1.default.dirname(normalized));
    const prefix = isDirInput ? '' : path_1.default.basename(normalized);
    try {
        const entries = fs_1.default.readdirSync(baseDir, { withFileTypes: true });
        return entries
            .filter(e => !e.name.startsWith('.'))
            .filter(e => {
            if (kind === 'file')
                return e.isFile();
            return e.isDirectory();
        })
            .filter(e => e.name.startsWith(prefix))
            .map(e => {
            const fullPath = path_1.default.join(baseDir, e.name);
            const suggestion = e.isDirectory()
                ? fullPath + path_1.default.sep
                : fullPath;
            return suggestion.replace(/^\\/g, '');
        });
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=path.js.map