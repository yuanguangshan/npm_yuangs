const { exec } = require('child_process');
const path = require('path');
const yuangs = require('../index.js');

describe('Module: index.js', () => {
    beforeEach(() => {
        yuangs.clearConversationHistory();
    });

    test('should export correct app URLs', () => {
        expect(yuangs.urls).toHaveProperty('shici');
        expect(yuangs.urls).toHaveProperty('dict');
        expect(yuangs.urls).toHaveProperty('pong');
        expect(yuangs.urls.shici).toContain('shici/index.html');
    });

    test('should have openApp function', () => {
        expect(typeof yuangs.openApp).toBe('function');
    });

    test('should have backward compatibility functions', () => {
        expect(typeof yuangs.openShici).toBe('function');
        expect(typeof yuangs.openDict).toBe('function');
        expect(typeof yuangs.openPong).toBe('function');
    });

    test('should manage conversation history correctly', () => {
        yuangs.addToConversationHistory('user', 'hello');
        let history = yuangs.getConversationHistory();
        expect(history).toHaveLength(1);
        expect(history[0]).toEqual({ role: 'user', content: 'hello' });

        yuangs.addToConversationHistory('assistant', 'hi');
        history = yuangs.getConversationHistory();
        expect(history).toHaveLength(2);
        expect(history[1]).toEqual({ role: 'assistant', content: 'hi' });
    });

    test('should limit conversation history to 20 items', () => {
        for (let i = 0; i < 25; i++) {
            yuangs.addToConversationHistory('user', `msg ${i}`);
        }
        const history = yuangs.getConversationHistory();
        expect(history).toHaveLength(20);
        expect(history[history.length - 1].content).toBe('msg 24');
        // The first 5 should be dropped, so the first one in history should be 'msg 5'
        expect(history[0].content).toBe('msg 5');
    });

    test('should clear conversation history', () => {
        yuangs.addToConversationHistory('user', 'test');
        yuangs.clearConversationHistory();
        expect(yuangs.getConversationHistory()).toHaveLength(0);
    });
});

describe('CLI Integration', () => {
    const cliPath = path.join(__dirname, '../cli.js');

    test('should print help message', (done) => {
        exec(`node ${cliPath} --help`, (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('苑广山的个人应用启动器');
            expect(stdout).toContain('使用方法:');
            done();
        });
    });

    test('should list apps', (done) => {
        exec(`node ${cliPath} list`, (error, stdout, stderr) => {
            expect(error).toBeNull();
            expect(stdout).toContain('苑广山的应用列表');
            expect(stdout).toContain('shici');
            expect(stdout).toContain('dict');
            done();
        });
    });
});
