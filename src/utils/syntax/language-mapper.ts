/**
 * 根据文件路径智能识别编程语言
 */
export function getLanguageByPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  if (!ext) return 'text';

  const langMap: Record<string, string> = {
    ts: 'typescript',
    js: 'javascript',
    tsx: 'typescript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    md: 'markdown',
    json: 'json',
    rs: 'rust',
    go: 'go',
    c: 'c',
    cpp: 'cpp',
    h: 'cpp',
    java: 'java',
    kt: 'kotlin',
    css: 'css',
    scss: 'scss',
    html: 'html',
    sql: 'sql',
    vue: 'html',
    makefile: 'makefile',
    dockerfile: 'dockerfile',
  };

  return langMap[ext] || ext;
}
