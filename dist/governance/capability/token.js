"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = sign;
exports.verify = verify;
exports.issue = issue;
exports.checkCapability = checkCapability;
exports.attenuate = attenuate;
exports.revoke = revoke;
exports.checkRevoked = checkRevoked;
const crypto_1 = __importDefault(require("crypto"));
const SECRET = process.env.CAP_SECRET || "default-secret-change-in-production";
function sign(data) {
    return crypto_1.default
        .createHmac("sha256", SECRET)
        .update(data)
        .digest("hex");
}
function verify(cap) {
    const { signature, ...rest } = cap;
    const payload = JSON.stringify(rest);
    const computed = sign(payload);
    return computed === signature;
}
function issue(input) {
    const base = {
        id: crypto_1.default.randomUUID(),
        subject: input.subject,
        rights: input.rights,
        scope: input.scope,
        issuedAt: Date.now(),
        expiresAt: Date.now() + input.ttlMs,
        maxUses: input.maxUses ?? 1,
        used: 0,
    };
    const payload = JSON.stringify(base);
    return {
        ...base,
        signature: sign(payload),
    };
}
function checkCapability(cap, want, context) {
    if (!verify(cap)) {
        throw new Error("Invalid capability: signature verification failed");
    }
    if (Date.now() > cap.expiresAt) {
        throw new Error("Capability expired");
    }
    if (cap.used >= cap.maxUses) {
        throw new Error("Capability exhausted (max uses reached)");
    }
    const rightMatch = cap.rights.some((r) => JSON.stringify(r) === JSON.stringify(want));
    if (!rightMatch) {
        throw new Error(`Capability does not grant right: ${JSON.stringify(want)}`);
    }
    if (cap.scope.type === "ACTION" && context.actionId !== cap.scope.id) {
        throw new Error(`Scope violation: capability scoped to action ${cap.scope.id}, used on ${context.actionId}`);
    }
    if (cap.scope.type === "PATH_PREFIX" &&
        context.path &&
        !context.path.startsWith(cap.scope.prefix)) {
        throw new Error(`Scope violation: capability scoped to ${cap.scope.prefix}, used on ${context.path}`);
    }
    cap.used++;
}
function attenuate(cap, limits) {
    if (!verify(cap)) {
        throw new Error("Cannot attenuate invalid capability");
    }
    const reduced = {
        ...cap,
        expiresAt: Math.min(cap.expiresAt, limits.expiresAt ?? cap.expiresAt),
        maxUses: Math.min(cap.maxUses, limits.maxUses ?? cap.maxUses),
        used: 0,
        signature: "",
    };
    const payload = JSON.stringify({
        id: reduced.id,
        subject: reduced.subject,
        rights: reduced.rights,
        scope: reduced.scope,
        issuedAt: reduced.issuedAt,
        expiresAt: reduced.expiresAt,
        maxUses: reduced.maxUses,
        used: 0,
    });
    return {
        ...reduced,
        signature: sign(payload),
    };
}
const revokedCaps = new Set();
function revoke(capId) {
    revokedCaps.add(capId);
}
function checkRevoked(cap) {
    if (revokedCaps.has(cap.id)) {
        throw new Error(`Capability ${cap.id} has been revoked`);
    }
}
//# sourceMappingURL=token.js.map