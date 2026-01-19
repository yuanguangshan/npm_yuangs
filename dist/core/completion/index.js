"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installZshCompletion = exports.installBashCompletion = exports.getCommandDescription = exports.getCommandSubcommands = exports.getAllCommands = exports.setProgramInstance = void 0;
exports.complete = complete;
const resolver_1 = require("./resolver");
async function complete(req) {
    if (!Array.isArray(req.words)) {
        return { items: [], isPartial: false };
    }
    if (typeof req.currentIndex !== 'number' ||
        req.currentIndex < 0 ||
        req.currentIndex >= req.words.length) {
        return { items: [], isPartial: false };
    }
    return (0, resolver_1.resolveCompletion)(req);
}
var resolver_2 = require("./resolver");
Object.defineProperty(exports, "setProgramInstance", { enumerable: true, get: function () { return resolver_2.setProgramInstance; } });
var completion_legacy_1 = require("../completion.legacy");
Object.defineProperty(exports, "getAllCommands", { enumerable: true, get: function () { return completion_legacy_1.getAllCommands; } });
Object.defineProperty(exports, "getCommandSubcommands", { enumerable: true, get: function () { return completion_legacy_1.getCommandSubcommands; } });
Object.defineProperty(exports, "getCommandDescription", { enumerable: true, get: function () { return completion_legacy_1.getCommandDescription; } });
Object.defineProperty(exports, "installBashCompletion", { enumerable: true, get: function () { return completion_legacy_1.installBashCompletion; } });
Object.defineProperty(exports, "installZshCompletion", { enumerable: true, get: function () { return completion_legacy_1.installZshCompletion; } });
//# sourceMappingURL=index.js.map