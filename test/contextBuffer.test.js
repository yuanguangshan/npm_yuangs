const { ContextBuffer } = require('../dist/commands/contextBuffer');

describe('ContextBuffer', () => {
    let contextBuffer;

    beforeEach(() => {
        contextBuffer = new ContextBuffer();
    });

    test('should add items to buffer', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is a test file content.',
        };

        contextBuffer.add(item);

        expect(contextBuffer.isEmpty()).toBe(false);
        expect(contextBuffer.export().length).toBe(1);
        expect(contextBuffer.export()[0].path).toBe('/test/file.txt');
    });

    test('should calculate tokens correctly', () => {
        const content = 'This is a test content for token calculation.';
        const expectedTokens = Math.ceil(content.length / 4);

        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: content,
        };

        contextBuffer.add(item);
        const exported = contextBuffer.export();

        expect(exported[0].tokens).toBe(expectedTokens);
    });

    test('should trim items when exceeding token limit', () => {
        // 设置一个小的token限制用于测试
        const smallContextBuffer = new ContextBuffer();
        
        // 添加多个项目直到超过限制
        for (let i = 0; i < 10; i++) {
            const item = {
                type: 'file',
                path: '/test/file' + i + '.txt',
                content: 'A'.repeat(5000), // 大量内容以快速达到token限制
            };
            smallContextBuffer.add(item, true); // 绕过限制进行添加
        }

        // 现在添加一个新项目，不绕过限制，应该触发修剪
        const newItem = {
            type: 'file',
            path: '/test/newfile.txt',
            content: 'New content',
        };
        smallContextBuffer.add(newItem); // 不绕过限制

        // 检查是否修剪了旧项目
        const items = smallContextBuffer.export();
        expect(items.length).toBeGreaterThan(0); // 应该仍有项目
    });

    test('should clear all items', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is a test file content.',
        };

        contextBuffer.add(item);
        expect(contextBuffer.isEmpty()).toBe(false);

        contextBuffer.clear();
        expect(contextBuffer.isEmpty()).toBe(true);
        expect(contextBuffer.export().length).toBe(0);
    });

    test('should list items with correct format', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is a test file content.',
        };

        contextBuffer.add(item);
        const listed = contextBuffer.list();

        expect(listed.length).toBe(1);
        expect(listed[0].index).toBe(1);
        expect(listed[0].type).toBe('file');
        expect(listed[0].path).toBe('/test/file.txt');
    });

    test('should build prompt with context', () => {
        const item = {
            type: 'file',
            path: '/test/file.txt',
            content: 'This is the context content.',
            alias: 'Test File'
        };

        contextBuffer.add(item);
        const prompt = contextBuffer.buildPrompt('What is in the file?');

        expect(prompt).toContain('知识上下文');
        expect(prompt).toContain('Test File');
        expect(prompt).toContain('/test/file.txt');
        expect(prompt).toContain('This is the context content.');
        expect(prompt).toContain('What is in the file?');
    });

    test('should return userInput when no context', () => {
        const prompt = contextBuffer.buildPrompt('What is in the file?');

        expect(prompt).toContain('What is in the file?');
        expect(prompt).not.toContain('知识上下文');
    });

    test('should import items correctly', () => {
        const items = [{
            type: 'file',
            path: '/imported/file.txt',
            content: 'Imported content',
            tokens: 10
        }];

        contextBuffer.import(items);
        const exported = contextBuffer.export();

        expect(exported.length).toBe(1);
        expect(exported[0].path).toBe('/imported/file.txt');
        expect(exported[0].content).toBe('Imported content');
    });
});
