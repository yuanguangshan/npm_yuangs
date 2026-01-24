"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceError = void 0;
class GovernanceError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GovernanceError';
        Object.setPrototypeOf(this, GovernanceError.prototype);
    }
}
exports.GovernanceError = GovernanceError;
//# sourceMappingURL=errors.js.map