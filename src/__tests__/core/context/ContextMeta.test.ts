import {
    ContextMeta,
    ContextMetaBuilder,
    toAuditLog,
    mergeMetas,
} from '../../../core/context/ContextMeta';

describe('ContextMeta', () => {
    describe('ContextMetaBuilder', () => {
        it('should build basic context meta', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test reason')
                .setProvenance('test-source')
                .build();

            expect(meta.confidence).toBe(0.8);
            expect(meta.confidenceReason).toBe('Test reason');
            expect(meta.provenance.source).toBe('test-source');
            expect(meta.timestamp).toBeDefined();
            expect(meta.version).toBeDefined();
        });

        it('should set confidence with reason', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.95, 'High confidence due to complete data')
                .setProvenance('test-source')
                .build();

            expect(meta.confidence).toBe(0.95);
            expect(meta.confidenceReason).toBe('High confidence due to complete data');
        });

        it('should clamp confidence between 0 and 1', () => {
            const meta1 = new ContextMetaBuilder()
                .setConfidence(1.5, 'Test')
                .setProvenance('test')
                .build();

            const meta2 = new ContextMetaBuilder()
                .setConfidence(-0.5, 'Test')
                .setProvenance('test')
                .build();

            expect(meta1.confidence).toBe(1.0);
            expect(meta2.confidence).toBe(0.0);
        });

        it('should set provenance with ref and time range', () => {
            const timeRange = {
                start: '2024-01-01',
                end: '2024-12-31',
            };

            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test-source', 'ref-123', timeRange)
                .build();

            expect(meta.provenance.source).toBe('test-source');
            expect(meta.provenance.ref).toBe('ref-123');
            expect(meta.provenance.timeRange).toEqual(timeRange);
        });

        it('should set clipped information', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test')
                .setClipped('Size limit exceeded', ['file1.ts', 'file2.ts'])
                .build();

            expect(meta.clipped).toBeDefined();
            expect(meta.clipped!.reason).toBe('Size limit exceeded');
            expect(meta.clipped!.droppedItems).toEqual(['file1.ts', 'file2.ts']);
        });

        it('should set default confidence when not explicitly set', () => {
            const meta = new ContextMetaBuilder()
                .setProvenance('test')
                .build();

            expect(meta.confidence).toBe(0.5);
            expect(meta.confidenceReason).toBe('No explicit confidence set, using default');
        });

        it('should set default provenance when not explicitly set', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .build();

            expect(meta.provenance.source).toBe('unknown');
        });
    });

    describe('ContextMetaBuilder.fromPartial', () => {
        it('should build from partial meta', () => {
            const partial: Partial<ContextMeta> = {
                confidence: 0.75,
                confidenceReason: 'Partial confidence',
                provenance: {
                    source: 'partial-source',
                },
            };

            const meta = ContextMetaBuilder.fromPartial(partial);

            expect(meta.confidence).toBe(0.75);
            expect(meta.confidenceReason).toBe('Partial confidence');
            expect(meta.provenance.source).toBe('partial-source');
        });

        it('should handle clipped info from partial', () => {
            const partial: Partial<ContextMeta> = {
                confidence: 0.8,
                confidenceReason: 'Test',
                provenance: {
                    source: 'test',
                },
                clipped: {
                    reason: 'Test reason',
                    droppedItems: ['file1'],
                },
            };

            const meta = ContextMetaBuilder.fromPartial(partial);

            expect(meta.clipped).toBeDefined();
            expect(meta.clipped!.reason).toBe('Test reason');
            expect(meta.clipped!.droppedItems).toEqual(['file1']);
        });

        it('should handle time range from partial', () => {
            const partial: Partial<ContextMeta> = {
                confidence: 0.8,
                confidenceReason: 'Test',
                provenance: {
                    source: 'test',
                    ref: 'ref-123',
                    timeRange: {
                        start: '2024-01-01',
                        end: '2024-12-31',
                    },
                },
            };

            const meta = ContextMetaBuilder.fromPartial(partial);

            expect(meta.provenance.timeRange).toBeDefined();
            expect(meta.provenance.timeRange!.start).toBe('2024-01-01');
        });
    });

    describe('toAuditLog', () => {
        it('should generate audit log', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.85, 'High confidence')
                .setProvenance('test-source', 'ref-123')
                .build();

            const log = toAuditLog(meta);

            expect(log).toContain('Context Audit Log');
            expect(log).toContain('Confidence: 85.0%');
            expect(log).toContain('High confidence');
            expect(log).toContain('Source: test-source');
            expect(log).toContain('Reference: ref-123');
            expect(log).toContain('Clipped: No');
        });

        it('should include clipped info when present', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test')
                .setClipped('Size limit', ['file1', 'file2'])
                .build();

            const log = toAuditLog(meta);

            expect(log).toContain('Clipped: Yes');
            expect(log).toContain('Size limit');
            expect(log).toContain('file1');
            expect(log).toContain('file2');
        });

        it('should include time range when present', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test', 'ref', {
                    start: '2024-01-01',
                    end: '2024-12-31',
                })
                .build();

            const log = toAuditLog(meta);

            expect(log).toContain('Time Range: 2024-01-01 to 2024-12-31');
        });
    });

    describe('mergeMetas', () => {
        it('should return default meta for empty array', () => {
            const merged = mergeMetas([]);

            expect(merged).toBeDefined();
            expect(merged.confidence).toBe(0.5);
        });

        it('should return single meta when array has one element', () => {
            const meta = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test')
                .build();

            const merged = mergeMetas([meta]);

            expect(merged).toBe(meta);
        });

        it('should merge multiple metas', () => {
            const meta1 = new ContextMetaBuilder()
                .setConfidence(0.8, 'Confidence 1')
                .setProvenance('source1')
                .build();

            const meta2 = new ContextMetaBuilder()
                .setConfidence(0.6, 'Confidence 2')
                .setProvenance('source2')
                .build();

            const merged = mergeMetas([meta1, meta2]);

            expect(merged.confidence).toBe(0.7);
            expect(merged.confidenceReason).toContain('Average confidence from 2 sources');
            expect(merged.provenance.source).toContain('merged');
            expect(merged.provenance.source).toContain('source1');
            expect(merged.provenance.source).toContain('source2');
        });

        it('should merge clipped info from multiple metas', () => {
            const meta1 = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test1')
                .setClipped('Reason 1', ['file1'])
                .build();

            const meta2 = new ContextMetaBuilder()
                .setConfidence(0.6, 'Test')
                .setProvenance('test2')
                .setClipped('Reason 2', ['file2'])
                .build();

            const merged = mergeMetas([meta1, meta2]);

            expect(merged.clipped).toBeDefined();
            expect(merged.clipped!.droppedItems).toContain('file1');
            expect(merged.clipped!.droppedItems).toContain('file2');
        });

        it('should handle metas with and without clipped info', () => {
            const meta1 = new ContextMetaBuilder()
                .setConfidence(0.8, 'Test')
                .setProvenance('test1')
                .setClipped('Reason', ['file1'])
                .build();

            const meta2 = new ContextMetaBuilder()
                .setConfidence(0.6, 'Test')
                .setProvenance('test2')
                .build();

            const merged = mergeMetas([meta1, meta2]);

            expect(merged.clipped).toBeDefined();
            expect(merged.clipped!.droppedItems).toContain('file1');
        });
    });
});
