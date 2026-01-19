"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateChecksum = calculateChecksum;
exports.validateManifest = validateManifest;
const crypto_1 = require("crypto");
function calculateChecksum(manifest) {
    const data = JSON.stringify({
        id: manifest.id,
        version: manifest.version,
        requires: manifest.requires.sort(),
        dependsOn: manifest.dependsOn
    });
    return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
}
function validateManifest(manifest) {
    if (!manifest.id || typeof manifest.id !== 'string')
        return false;
    if (!manifest.version || typeof manifest.version !== 'string')
        return false;
    if (!manifest.state || !['draft', 'approved', 'deprecated'].includes(manifest.state))
        return false;
    if (!Array.isArray(manifest.requires))
        return false;
    if (!manifest.checksum || typeof manifest.checksum !== 'string')
        return false;
    if (!manifest.author || typeof manifest.author !== 'string')
        return false;
    if (!manifest.createdAt || typeof manifest.createdAt !== 'number')
        return false;
    return true;
}
//# sourceMappingURL=manifest.js.map