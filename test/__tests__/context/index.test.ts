import fs from 'fs';
import path from 'path';
import os from 'os';
import { ContextStore } from '../../../src/commands/context/ContextStore';
import { ContextAssembler } from '../../../src/commands/context/ContextAssembler';
import { ContextItem, ContextSource, ContextStatus } from '../../../src/commands/context/ContextTypes';

describe('ContextStore', () => {
    let tempDir: string;
    let testFilePath: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'context-test-'));
        testFilePath = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFilePath, 'test content');
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe('add and get', () => {
        it('should add a context item', () => {
            const store = new ContextStore();
            const item: ContextItem = {
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'test content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active'
            };

            store.add(item);
            const retrieved = store.get('test-1');

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe('test-1');
            expect(retrieved?.path).toBe(testFilePath);
        });

        it('should add multiple items', () => {
            const store = new ContextStore();
            store.add({
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'content1',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active'
            });

            store.add({
                id: 'test-2',
                source: 'memory',
                path: 'memory-1',
                content: 'content2',
                tokens: 20,
                importance: 0.8,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active'
            });

            expect(store.all().length).toBe(2);
        });
    });

    describe('update', () => {
        it('should update existing item', () => {
            const store = new ContextStore();
            const item: ContextItem = {
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'test content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active'
            };

            store.add(item);
            store.update('test-1', { importance: 0.9 });

            const updated = store.get('test-1');
            expect(updated?.importance).toBe(0.9);
        });

        it('should not fail when updating non-existent item', () => {
            const store = new ContextStore();
            expect(() => store.update('non-existent', { importance: 0.9 })).not.toThrow();
        });
    });

    describe('remove', () => {
        it('should remove an item', () => {
            const store = new ContextStore();
            store.add({
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active'
            });

            store.remove('test-1');
            expect(store.get('test-1')).toBeUndefined();
        });
    });

    describe('list with status filter', () => {
        beforeEach(() => {
            const store = new ContextStore();
            const now = Date.now();

            store.add({
                id: 'active-1',
                source: 'file',
                path: testFilePath,
                content: 'active content',
                tokens: 10,
                importance: 0.8,
                lastUsedAt: now,
                addedAt: now,
                status: 'active'
            });

            store.add({
                id: 'memory-1',
                source: 'memory',
                path: 'memory-1',
                content: 'memory content',
                tokens: 20,
                importance: 0.9,
                lastUsedAt: now,
                addedAt: now,
                status: 'memory',
                pinned: true
            });

            store.add({
                id: 'stale-1',
                source: 'file',
                path: testFilePath + '2',
                content: 'stale content',
                tokens: 15,
                importance: 0.3,
                lastUsedAt: now,
                addedAt: now,
                status: 'stale'
            });
        });

        it('should list all items when no status filter provided', () => {
            const store = new ContextStore();
            const now = Date.now();

            store.add({
                id: 'active-1',
                source: 'file',
                path: testFilePath,
                content: 'active content',
                tokens: 10,
                importance: 0.8,
                lastUsedAt: now,
                addedAt: now,
                status: 'active'
            });

            const all = store.list();
            expect(all.length).toBe(1);
        });

        it('should filter by status', () => {
            const store = new ContextStore();
            const now = Date.now();

            store.add({
                id: 'active-1',
                source: 'file',
                path: testFilePath,
                content: 'active content',
                tokens: 10,
                importance: 0.8,
                lastUsedAt: now,
                addedAt: now,
                status: 'active'
            });

            store.add({
                id: 'memory-1',
                source: 'memory',
                path: 'memory-1',
                content: 'memory content',
                tokens: 20,
                importance: 0.9,
                lastUsedAt: now,
                addedAt: now,
                status: 'memory',
                pinned: true
            });

            const memoryItems = store.list('memory');
            expect(memoryItems.length).toBe(1);
            expect(memoryItems[0].status).toBe('memory');
        });
    });

    describe('TTL and GC', () => {
        it('should mark items as expired when TTL is exceeded', () => {
            const store = new ContextStore();
            const oldTime = Date.now() - 61000; // 61 seconds ago

            store.add({
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: oldTime,
                addedAt: oldTime,
                status: 'active',
                ttlMs: 60000 // 60 seconds
            });

            store.enforceTTL();
            const item = store.get('test-1');
            expect(item?.status).toBe('expired');
        });

        it('should not expire pinned items', () => {
            const store = new ContextStore();
            const oldTime = Date.now() - 61000;

            store.add({
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: oldTime,
                addedAt: oldTime,
                status: 'active',
                ttlMs: 60000,
                pinned: true
            });

            store.enforceTTL();
            const item = store.get('test-1');
            expect(item?.status).not.toBe('expired');
        });

        it('should remove expired items after GC', () => {
            const store = new ContextStore();
            const oldTime = Date.now() - 61000;

            store.add({
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: 'content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: oldTime,
                addedAt: oldTime,
                status: 'expired',
                ttlMs: 60000
            });

            store.gc();
            expect(store.get('test-1')).toBeUndefined();
        });
    });

    describe('Drift Detection', () => {
        it('should detect drift when file content changes', () => {
            const store = new ContextStore();
            const initialContent = 'initial content';
            const modifiedContent = 'modified content';

            store.add({
                id: 'test-1',
                source: 'file',
                path: testFilePath,
                content: initialContent,
                tokens: 10,
                importance: 0.5,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active',
                hash: Buffer.from(initialContent).toString('base64')
            });

            fs.writeFileSync(testFilePath, modifiedContent);

            const driftReports = store.detectDrift();
            expect(driftReports.length).toBeGreaterThan(0);
            expect(driftReports[0].id).toBe('test-1');
        });

        it('should not detect drift for non-file sources', () => {
            const store = new ContextStore();

            store.add({
                id: 'memory-1',
                source: 'memory',
                path: 'memory-1',
                content: 'content',
                tokens: 10,
                importance: 0.5,
                lastUsedAt: Date.now(),
                addedAt: Date.now(),
                status: 'active'
            });

            const driftReports = store.detectDrift();
            expect(driftReports.length).toBe(0);
        });
    });
});

describe('ContextAssembler', () => {
    describe('sanitizeContent', () => {
        it('should redact OpenAI API keys', () => {
            const assembler = new ContextAssembler();
            const content = 'API key: sk-abc123def456ghi789jkl012mno345';

            const result = assembler.sanitizeContent(content);

            expect(result.sanitized).toContain('[REDACTED_API_KEY]');
            expect(result.findings.length).toBeGreaterThan(0);
            expect(result.findings[0].rule).toBe('OpenAI Key');
        });

        it('should redact passwords', () => {
            const assembler = new ContextAssembler();
            const content = 'password=secret123';

            const result = assembler.sanitizeContent(content);

            expect(result.sanitized).toContain('[REDACTED]');
            expect(result.findings.length).toBeGreaterThan(0);
            expect(result.findings[0].rule).toBe('Password');
        });

        it('should redact private keys', () => {
            const assembler = new ContextAssembler();
            const content = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`;

            const result = assembler.sanitizeContent(content);

            expect(result.sanitized).toContain('[REDACTED_PRIVATE_KEY]');
            expect(result.findings.length).toBeGreaterThan(0);
            expect(result.findings[0].rule).toBe('Private Key Block');
        });

        it('should return content unchanged when no secrets found', () => {
            const assembler = new ContextAssembler();
            const content = 'just normal text';

            const result = assembler.sanitizeContent(content);

            expect(result.sanitized).toBe(content);
            expect(result.findings.length).toBe(0);
        });
    });

    describe('assemble', () => {
        it('should assemble prompt with memory, active, and reference context', () => {
            const store = new ContextStore();
            const assembler = new ContextAssembler();
            const now = Date.now();

            store.add({
                id: 'memory-1',
                source: 'memory',
                path: 'memory-1',
                content: 'memory content',
                tokens: 10,
                importance: 0.9,
                lastUsedAt: now,
                addedAt: now,
                status: 'memory',
                pinned: true
            });

            store.add({
                id: 'active-1',
                source: 'file',
                path: 'file1.txt',
                content: 'active content',
                tokens: 10,
                importance: 0.8,
                lastUsedAt: now,
                addedAt: now,
                status: 'active'
            });

            const prompt = assembler.assemble(store, 'test question');

            expect(prompt).toContain('# System Memory');
            expect(prompt).toContain('# Active Context');
            expect(prompt).toContain('# Reference Context');
            expect(prompt).toContain('test question');
        });

        it('should return user input when context is empty', () => {
            const store = new ContextStore();
            const assembler = new ContextAssembler();

            const prompt = assembler.assemble(store, 'simple question');

            expect(prompt).toBe('simple question');
        });
    });
});
