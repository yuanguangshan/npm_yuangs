"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = buildContext;
const codeSummary_1 = require("./codeSummary");
/**
 * Build context for agent execution
 * Implements intelligent token optimization by using AST summaries for large files
 * instead of sending full file contents
 */
function buildContext(input, contextBuffer) {
    const items = contextBuffer.export();
    const files = items.map(item => {
        const content = item.content ?? item.summary ?? '';
        // Token optimization: Use summary instead of full content if file is large (> 500 lines or > 20KB)
        const lines = content.split('\n').length;
        const sizeKb = content.length / 1024;
        if (lines > 500 || sizeKb > 20) {
            const summary = (0, codeSummary_1.generateFileSummary)(item.path, content);
            return {
                path: item.path,
                content: summary.summary, // Use AST summary instead of full content
            };
        }
        return {
            path: item.path,
            content: content,
        };
    });
    return {
        files,
        gitDiff: undefined, // Will be enhanced later
        history: [], // Will be populated from conversation history
    };
}
//# sourceMappingURL=context.js.map