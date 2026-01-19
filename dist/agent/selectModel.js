"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectModel = selectModel;
const client_1 = require("../ai/client");
function selectModel(intent, override) {
    if (override)
        return override;
    const config = (0, client_1.getUserConfig)();
    const defaultModel = config.defaultModel || 'gemini-2.5-flash-lite';
    return defaultModel;
}
//# sourceMappingURL=selectModel.js.map