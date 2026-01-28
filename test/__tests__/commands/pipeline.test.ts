import { processPipelineSegment } from '../../../src/commands/handleAIChat';
import * as syntaxHandler from '../../../src/utils/syntaxHandler';
import * as shellCompletions from '../../../src/commands/shellCompletions';
import chalk from 'chalk';

// Mock dependencies
jest.mock('../../../src/utils/syntaxHandler');
jest.mock('../../../src/commands/shellCompletions');
jest.mock('chalk', () => ({
    green: jest.fn((s) => s),
    red: jest.fn((s) => s),
    blue: { bold: jest.fn((s) => s) },
    cyan: jest.fn((s) => s),
    gray: jest.fn((s) => s)
}));

describe('processPipelineSegment', () => {
    let mockRl: any;
    let mockProcessInteraction: jest.Mock;

    beforeEach(() => {
        mockRl = {
            pause: jest.fn(),
            resume: jest.fn()
        };
        mockProcessInteraction = jest.fn();
        jest.clearAllMocks();
    });

    it('should handle special syntax segment', async () => {
        (syntaxHandler.handleSpecialSyntax as jest.Mock).mockResolvedValue({
            processed: true,
            result: 'some context content',
            type: 'file'
        });

        const result = await processPipelineSegment('@file.txt', undefined, false, mockRl, mockProcessInteraction);

        expect(result).toBe('some context content');
        expect(syntaxHandler.handleSpecialSyntax).toHaveBeenCalledWith('@file.txt', undefined);
    });

    it('should handle shell command segment', async () => {
        (syntaxHandler.handleSpecialSyntax as jest.Mock).mockResolvedValue({ processed: false });
        (shellCompletions.detectMode as jest.Mock).mockReturnValue('command');
        (shellCompletions.executeCommand as jest.Mock).mockResolvedValue('command output');

        const result = await processPipelineSegment('grep foo', 'upstream input', false, mockRl, mockProcessInteraction);

        expect(result).toBe('command output');
        expect(shellCompletions.executeCommand).toHaveBeenCalledWith('grep foo', undefined, 'upstream input', true);
        expect(mockRl.pause).toHaveBeenCalled();
        expect(mockRl.resume).toHaveBeenCalled();
    });

    it('should trigger AI interaction on last segment if it is a question', async () => {
        (syntaxHandler.handleSpecialSyntax as jest.Mock).mockResolvedValue({ processed: false });
        (shellCompletions.detectMode as jest.Mock).mockReturnValue('chat');

        await processPipelineSegment('explain this', 'some code data', true, mockRl, mockProcessInteraction);

        expect(mockProcessInteraction).toHaveBeenCalledWith(expect.stringContaining('explain this'));
        expect(mockProcessInteraction).toHaveBeenCalledWith(expect.stringContaining('some code data'));
    });

    it('should return verbatim if not special, command, and not last', async () => {
        (syntaxHandler.handleSpecialSyntax as jest.Mock).mockResolvedValue({ processed: false });
        (shellCompletions.detectMode as jest.Mock).mockReturnValue('chat');

        const result = await processPipelineSegment('pure text', undefined, false, mockRl, mockProcessInteraction);

        expect(result).toBe('pure text');
    });
});
