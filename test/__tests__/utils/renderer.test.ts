import chalk from 'chalk';
import { MarkdownRenderer, renderMarkdown } from '../../../src/utils/renderer';

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
        expect(result).toContain('• Item 1');
        expect(result).toContain('• Item 2');
    });

    it('should render ordered lists', () => {
        const markdown = '1. First\n2. Second';
        const result = renderer.render(markdown);
        expect(result).toContain('1. First');
        expect(result).toContain('2. Second');
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
