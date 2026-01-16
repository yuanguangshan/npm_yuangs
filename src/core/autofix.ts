import { OSProfile } from './os';
import { buildFixPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { safeParseJSON, AIFixPlan, aiFixPlanSchema } from './validation';

export async function autoFixCommand(
    originalCmd: string,
    stderr: string,
    os: OSProfile,
    model?: string
): Promise<AIFixPlan | null> {
    const prompt = buildFixPrompt(originalCmd, stderr, os);
    const raw = await askAI(prompt, model);

    const parseResult = safeParseJSON(raw, aiFixPlanSchema, {} as AIFixPlan);

    if (!parseResult.success) {
        return null;
    }

    return parseResult.data;
}
