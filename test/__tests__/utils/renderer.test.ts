import chalk from 'chalk';
import { MarkdownRenderer, renderMarkdown, StreamMarkdownRenderer } from '../../../src/utils/renderer';

describe('MarkdownRenderer', () => {
    let renderer: MarkdownRenderer;

    beforeEach(() => {
        renderer = new MarkdownRenderer();
    });

    it('should render headers correctly', () => {
        const markdown = '# Header 1\n## Header 2';
        const result = renderer.render(markdown);
        expect(result).toContain('# Header 1');
        expect(result).toContain('## Header 2');
    });

    it('should render bold and italic text', () => {
        const markdown = 'This is **bold** and *italic*';
        const result = renderer.render(markdown);
        // ANSI codes for bold and italic are complex to match exactly, 
        // but we can check if it's processed (different from original)
        expect(result).not.toBe(markdown);
        expect(result).toContain('bold');
        expect(result).toContain('italic');
    });

    it('should render code blocks with borders', () => {
        const markdown = '```ts\nconst x = 1;\n```';
        const result = renderer.render(markdown);
        expect(result).toContain('╭');
        expect(result).toContain('╰');
        expect(result).toContain('const x = 1;');
    });

    it('should render inline code', () => {
        const markdown = 'Use `code` here';
        const result = renderer.render(markdown);
        expect(result).toContain(' code ');
    });

    it('should render lists', () => {
        const markdown = '- Item 1\n- Item 2';
        const result = renderer.render(markdown);
        expect(result).toContain('Item 1');
        expect(result).toContain('Item 2');
        expect(result).toContain('•');
    });

    it('should render ordered lists', () => {
        const markdown = '1. First\n2. Second';
        const result = renderer.render(markdown);
        expect(result).toContain('First');
        expect(result).toContain('Second');
        expect(result).toContain('1.');
        // Note: Current implementation may not fully support ordered lists
        // This is a known limitation
    });

    it('should render blockquotes', () => {
        const markdown = '> Quote this';
        const result = renderer.render(markdown);
        expect(result).toContain('> Quote this');
    });
});

describe('renderMarkdown static function', () => {
    it('should offer a quick way to render markdown', () => {
        const result = renderMarkdown('**Bold**');
        expect(result).not.toBe('**Bold**');
        expect(result).toContain('Bold');
    });
});

describe('StreamMarkdownRenderer model footer', () => {
    it('setModelUsed 后 finish() 页脚展示模型名', () => {
        const writes: string[] = [];
        const spy = jest.spyOn(process.stdout, 'write').mockImplementation((s: any) => { writes.push(String(s)); return true; });
        try {
            const r = new StreamMarkdownRenderer('🤖 ');
            r.onChunk('hello');
            r.setModelUsed('gemini-2.5-flash');
            r.finish();
        } finally {
            spy.mockRestore();
        }
        const out = writes.join('');
        expect(out).toContain('模型: gemini-2.5-flash');
        expect(out).toContain('耗时');
    });

    it('未 setModelUsed 时页脚不含「模型:」', () => {
        const writes: string[] = [];
        const spy = jest.spyOn(process.stdout, 'write').mockImplementation((s: any) => { writes.push(String(s)); return true; });
        try {
            const r = new StreamMarkdownRenderer('🤖 ');
            r.onChunk('hi');
            r.finish();
        } finally {
            spy.mockRestore();
        }
        expect(writes.join('')).not.toContain('模型:');
    });
});
