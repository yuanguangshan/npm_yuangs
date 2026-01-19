import { CompletionRequest, CompletionResponse, CompletionItem } from './types';
import { unique } from './utils';
import { getBuiltinCommands } from './builtin';
import { loadAppsConfig } from '../apps';
import { getMacros } from '../macros';
import { Command } from 'commander';

let programInstance: Command | null = null;

export function setProgramInstance(program: Command): void {
  programInstance = program;
}

function getProgramInstance(): Command {
  return programInstance || ({} as Command);
}

export async function resolveCompletion(
  req: CompletionRequest
): Promise<CompletionResponse> {
  const { words, currentIndex } = req;

  const currentWord = words[currentIndex] ?? '';
  const previousWord = words[currentIndex - 1] ?? '';

  if (currentIndex === 1) {
    return completeTopLevel(currentWord);
  }

  return completeSubcommand(words.slice(1, currentIndex), currentWord, previousWord);
}

function completeTopLevel(prefix: string): CompletionResponse {
  const items: CompletionItem[] = [];

  const commands = getBuiltinCommands();
  commands.forEach(cmd => {
    items.push({ label: cmd.name });
  });

  try {
    const apps = loadAppsConfig();
    Object.keys(apps).forEach(name => {
      if (!items.find(i => i.label === name)) {
        items.push({ label: name });
      }
    });
  } catch {}

  try {
    const macros = getMacros();
    Object.keys(macros).forEach(name => {
      if (!items.find(i => i.label === name)) {
        items.push({ label: name });
      }
    });
  } catch {}

  const filtered = items.filter(item => item.label.startsWith(prefix));

  return {
    items: unique(filtered),
    isPartial: true
  };
}

function completeSubcommand(
  path: string[],
  prefix: string,
  prev: string
): CompletionResponse {
  const items: CompletionItem[] = [];

  if (prev === '--model' || prev === '-m') {
    items.push(
      { label: 'gemini-2.5-flash-lite' },
      { label: 'gemini-2.5-pro' },
      { label: 'Assistant' },
      { label: 'GPT-4o-mini' }
    );
  } else if (path.length > 0) {
    const baseCommand = path[0];
    const cmd = getProgramInstance().commands.find((c: any) => c.name() === baseCommand);

    if (cmd) {
      cmd.options.forEach((opt: any) => {
        opt.flags.split(/[, ]+/).forEach((flag: string) => {
          if (flag.startsWith('-') && !flag.startsWith('--')) {
            items.push({ label: flag });
          }
        });
      });

      cmd.commands.forEach((subcmd: any) => {
        items.push({ label: subcmd.name() });
      });
    }
  }

  const filtered = items.filter(item => item.label.startsWith(prefix));

  return {
    items: unique(filtered),
    isPartial: true
  };
}
