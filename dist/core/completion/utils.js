"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unique = unique;
function unique(items) {
    const seen = new Set();
    return items.filter(i => {
        if (seen.has(i.label))
            return false;
        seen.add(i.label);
        return true;
    });
}
//# sourceMappingURL=utils.js.map