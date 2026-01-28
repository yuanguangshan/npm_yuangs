"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextMetaBuilder = void 0;
exports.toAuditLog = toAuditLog;
exports.mergeMetas = mergeMetas;
class ContextMetaBuilder {
    meta = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    };
    setConfidence(value, reason) {
        this.meta.confidence = Math.max(0, Math.min(1, value));
        this.meta.confidenceReason = reason;
        return this;
    }
    setProvenance(source, ref, timeRange) {
        this.meta.provenance = {
            source,
            ref,
            timeRange,
        };
        return this;
    }
    setClipped(reason, droppedItems) {
        this.meta.clipped = {
            reason,
            droppedItems,
        };
        return this;
    }
    build() {
        if (this.meta.confidence === undefined) {
            this.meta.confidence = 0.5;
            this.meta.confidenceReason = 'No explicit confidence set, using default';
        }
        if (this.meta.provenance === undefined) {
            this.meta.provenance = {
                source: 'unknown',
            };
        }
        return this.meta;
    }
    static fromPartial(partial) {
        const builder = new ContextMetaBuilder();
        if (partial.confidence !== undefined) {
            builder.setConfidence(partial.confidence, partial.confidenceReason || 'Inferred');
        }
        if (partial.provenance) {
            builder.setProvenance(partial.provenance.source, partial.provenance.ref, partial.provenance.timeRange);
        }
        if (partial.clipped) {
            builder.setClipped(partial.clipped.reason, partial.clipped.droppedItems);
        }
        return builder.build();
    }
}
exports.ContextMetaBuilder = ContextMetaBuilder;
function toAuditLog(meta) {
    const log = [];
    log.push(`Context Audit Log`);
    log.push(`================`);
    log.push(`Timestamp: ${meta.timestamp}`);
    log.push(`Version: ${meta.version}`);
    log.push(`Confidence: ${(meta.confidence * 100).toFixed(1)}%`);
    log.push(`Confidence Reason: ${meta.confidenceReason}`);
    log.push(`Source: ${meta.provenance.source}`);
    if (meta.provenance.ref) {
        log.push(`Reference: ${meta.provenance.ref}`);
    }
    if (meta.provenance.timeRange) {
        log.push(`Time Range: ${meta.provenance.timeRange.start} to ${meta.provenance.timeRange.end}`);
    }
    if (meta.clipped) {
        log.push(`Clipped: Yes (${meta.clipped.reason})`);
        log.push(`Dropped Items (${meta.clipped.droppedItems.length}):`);
        for (const item of meta.clipped.droppedItems) {
            log.push(`  - ${item}`);
        }
    }
    else {
        log.push(`Clipped: No`);
    }
    return log.join('\n');
}
function mergeMetas(metas) {
    if (metas.length === 0) {
        return new ContextMetaBuilder().build();
    }
    if (metas.length === 1) {
        return metas[0];
    }
    const avgConfidence = metas.reduce((sum, m) => sum + m.confidence, 0) / metas.length;
    const sources = metas.map(m => m.provenance.source).filter((v, i, a) => a.indexOf(v) === i);
    const allDroppedItems = metas.filter(m => m.clipped).flatMap(m => m.clipped.droppedItems);
    let clippedInfo;
    if (allDroppedItems.length > 0) {
        clippedInfo = {
            reason: 'Merged from multiple contexts with clipped items',
            droppedItems: allDroppedItems,
        };
    }
    return new ContextMetaBuilder()
        .setConfidence(avgConfidence, `Average confidence from ${metas.length} sources`)
        .setProvenance(`merged(${sources.join(',')})`)
        .setClipped('Merged contexts had clipped items', allDroppedItems)
        .build();
}
//# sourceMappingURL=ContextMeta.js.map