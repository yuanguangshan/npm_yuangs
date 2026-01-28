import chalk from 'chalk';
import { YuangsError } from './errors';
import { logger } from '../utils/Logger';

/**
 * Global error handler for the CLI
 */
export class GlobalErrorHandler {
    /**
     * Standard way to display errors to the user
     */
    public static handleError(error: any, context?: string): void {
        const isYuangsError = error instanceof YuangsError;

        // Log the error details
        logger.error(context || 'Global', error.message, {
            code: isYuangsError ? error.code : 'UNKNOWN',
            stack: error.stack
        });

        console.log('\n' + chalk.red.bold('✕ Error: ') + chalk.white(error.message));

        if (isYuangsError && error.code) {
            console.log(chalk.gray(`Code: ${error.code}`));
        }

        if (isYuangsError && error.suggestions && error.suggestions.length > 0) {
            console.log('\n' + chalk.yellow.bold('💡 Suggestions:'));
            error.suggestions.forEach(suggestion => {
                console.log(chalk.yellow(`  • ${suggestion}`));
            });
        } else {
            // Generic suggestions based on common error patterns
            const genericSuggestions = this.getGenericSuggestions(error);
            if (genericSuggestions.length > 0) {
                console.log('\n' + chalk.cyan.bold('💡 Suggestions:'));
                genericSuggestions.forEach(suggestion => {
                    console.log(chalk.cyan(`  • ${suggestion}`));
                });
            }
        }

        console.log(''); // New line for spacing
    }

    private static getGenericSuggestions(error: any): string[] {
        const message = error.message?.toLowerCase() || '';
        const suggestions: string[] = [];

        if (message.includes('not a git repository')) {
            suggestions.push('Run this command inside a Git repository.', 'Use "git init" to create a new repository.');
        } else if (message.includes('permission denied') || message.includes('eacces')) {
            suggestions.push('Try running with elevated permissions.', 'Check the file/directory ownership.');
        } else if (message.includes('enoent')) {
            suggestions.push('Verify that the file or directory exists.');
        } else if (message.includes('network') || message.includes('econn')) {
            suggestions.push('Check your internet connection.', 'Verify if the remote service is up.');
        }

        return suggestions;
    }
}
