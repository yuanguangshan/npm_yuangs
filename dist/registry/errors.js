"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryError = exports.RegistryErrorCode = void 0;
var RegistryErrorCode;
(function (RegistryErrorCode) {
    RegistryErrorCode["INIT_FAILED"] = "INIT_FAILED";
    RegistryErrorCode["INVALID_MANIFEST"] = "INVALID_MANIFEST";
    RegistryErrorCode["CHECKSUM_MISMATCH"] = "CHECKSUM_MISMATCH";
    RegistryErrorCode["NOT_FOUND"] = "NOT_FOUND";
    RegistryErrorCode["INVALID_STATE"] = "INVALID_STATE";
    RegistryErrorCode["CAPABILITY_DENIED"] = "CAPABILITY_DENIED";
    RegistryErrorCode["DEPENDENCY_CYCLE"] = "DEPENDENCY_CYCLE";
    RegistryErrorCode["VERSION_CONFLICT"] = "VERSION_CONFLICT";
})(RegistryErrorCode || (exports.RegistryErrorCode = RegistryErrorCode = {}));
class RegistryError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = 'RegistryError';
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details
        };
    }
}
exports.RegistryError = RegistryError;
//# sourceMappingURL=errors.js.map