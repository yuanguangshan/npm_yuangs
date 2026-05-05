import fs from 'fs';
import path from 'path';
import { handleAtSyntax } from './at-handler';
import { handleDirectoryReference } from './directory-handler';
import { parseCatSpec } from './resolver';
import { handleListContext, handleCatContext, handleClearContext } from './context-commands';
import { handleAtomicExec } from './exec-handler';

// ============================================================================
// 入口：handleSpecialSyntax
// ============================================================================

export async function handleSpecialSyntax(
  input: string,
  stdinData?: string,
): Promise<{
  processed: boolean;
  result?: string;
  isPureReference?: boolean;
  error?: boolean;
  itemCount?: number;
  type?: 'file' | 'directory' | 'command' | 'management';
}> {
  const trimmed = input.trim();

  // @ 文件引用语法
  if (trimmed.startsWith('@')) {
    return await handleAtSyntax(trimmed, stdinData);
  }

  // # 目录引用语法
  if (trimmed.startsWith('#')) {
    const newlineDirMatch = trimmed.match(/^#\s*(.+?)\s*\n(.*)$/s);
    if (newlineDirMatch) {
      const dirPath = newlineDirMatch[1].trim();
      const question =
        newlineDirMatch[2].trim() ||
        (stdinData ? `分析以下目录内容：\n\n${stdinData}` : undefined);
      const hasQuestion = !!question || !!stdinData;
      const res = await handleDirectoryReference(dirPath, question);
      return { ...res, isPureReference: !hasQuestion, type: 'directory' };
    }

    const afterHash = trimmed.slice(1).trim();
    const spaceIdx = afterHash.search(/\s/);

    let candidatePath: string;
    let inlineQuestion: string | undefined;

    if (spaceIdx === -1) {
      candidatePath = afterHash;
      inlineQuestion = undefined;
    } else {
      candidatePath = afterHash.slice(0, spaceIdx).trim();
      inlineQuestion = afterHash.slice(spaceIdx).trim() || undefined;
    }

    if (!candidatePath) {
      return { processed: false };
    }

    const candidateFullPath = path.resolve(candidatePath);
    let diskExists = false;
    try {
      diskExists = fs.statSync(candidateFullPath).isDirectory();
    } catch {
      diskExists = false;
    }

    if (diskExists) {
      const question =
        inlineQuestion ||
        (stdinData ? `分析以下目录内容：\n\n${stdinData}` : undefined);
      const hasQuestion = !!question || !!stdinData;
      const res = await handleDirectoryReference(candidatePath, question);
      return { ...res, isPureReference: !hasQuestion, type: 'directory' };
    } else if (!inlineQuestion) {
      const res = await handleDirectoryReference(
        candidatePath,
        stdinData ? `分析以下目录内容：\n\n${stdinData}` : undefined,
      );
      return { ...res, isPureReference: !stdinData, type: 'directory' };
    } else {
      return {
        processed: true,
        result: `错误: 目录 "${candidatePath}" 不存在或不是一个目录\n💡 提示: 使用格式 #目录路径 问题，例如: #src 解释这个文件夹的作用`,
        error: true,
        isPureReference: false,
        type: 'directory' as const,
      };
    }
  }

  // :ls 命令
  if (trimmed === ':ls') {
    const res = await handleListContext();
    return { ...res, type: 'management' };
  }

  // :exec 原子执行
  if (trimmed.startsWith(':exec ')) {
    const command = trimmed.slice(6).trim();
    const res = await handleAtomicExec(command);
    return { ...res, type: 'command' };
  }

  // :cat [index] 命令
  if (trimmed === ':cat' || trimmed.startsWith(':cat ')) {
    const spec = trimmed.slice(4).trim();
    if (!spec) {
      const res = await handleCatContext(null);
      return { ...res, type: 'management' };
    }

    const parsed = parseCatSpec(spec);
    if (parsed.error) {
      return {
        processed: true,
        result: parsed.error,
        error: true,
        type: 'management',
      };
    }

    const res = await handleCatContext(
      parsed.index,
      parsed.startLine,
      parsed.endLine,
    );
    return { ...res, type: 'management' };
  }

  // :clear 命令
  if (trimmed === ':clear') {
    const res = await handleClearContext();
    return { ...res, type: 'management' };
  }

  return { processed: false };
}
