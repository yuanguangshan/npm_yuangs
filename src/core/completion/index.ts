import { CompletionRequest, CompletionResponse } from './types';
import { resolveCompletion } from './resolver';

export async function complete(
  req: CompletionRequest
): Promise<CompletionResponse> {
  if (!Array.isArray(req.words)) {
    return { items: [], isPartial: false };
  }

  if (
    typeof req.currentIndex !== 'number' ||
    req.currentIndex < 0 ||
    req.currentIndex >= req.words.length
  ) {
    return { items: [], isPartial: false };
  }

  return resolveCompletion(req);
}

export { setProgramInstance } from './resolver';

export {
  getAllCommands,
  getCommandSubcommands,
  getCommandDescription,
  installBashCompletion,
  installZshCompletion
} from '../completion.legacy';
