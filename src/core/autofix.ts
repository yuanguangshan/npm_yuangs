import { OSProfile } from './os';
import { buildFixPrompt } from '../ai/prompt';
import { askAI } from '../ai/client';
import { AICommandPlan } from '../ai/types';

export async function autoFixCommand(
    originalCmd: string,
    stderr: string,
    os: OSProfile,
    model?: string
): Promise<AICommandPlan | null> {
    const prompt = buildFixPrompt(originalCmd, stderr, os);
    const raw = await askAI(prompt, model);

    try {
        // Extract JSON if AI wrapped it in triple backticks
        let jsonContent = raw;
        if (raw.includes('```json')) {
            jsonContent = raw.split('```json')[1].split('```')[0].trim();
        } else if (raw.includes('```')) {
            jsonContent = raw.split('```')[1].split('```')[0].trim();
        }

        return JSON.parse(jsonContent);
    } catch {
        return null;
    }
}
