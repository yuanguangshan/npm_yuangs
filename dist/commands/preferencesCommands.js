"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPreferencesCommands = registerPreferencesCommands;
const chalk_1 = __importDefault(require("chalk"));
const preferences_1 = require("../agent/preferences");
function registerPreferencesCommands(program) {
    const preferencesProgram = program
        .command('preferences')
        .description('Manage AI interaction preferences');
    // List all preferences
    preferencesProgram
        .command('list')
        .description('List all current preferences')
        .action(() => {
        const prefs = preferences_1.PreferencesManager.getPreferences();
        console.log(chalk_1.default.bold.cyan('\n📋 Current Preferences\n'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        Object.entries(prefs).forEach(([key, value]) => {
            const formattedKey = formatKey(key);
            const formattedValue = formatValue(key, value);
            console.log(`  ${chalk_1.default.bold(formattedKey)}: ${formattedValue}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    // Get a specific preference
    preferencesProgram
        .command('get <key>')
        .description('Get a specific preference value')
        .action((key) => {
        const prefs = preferences_1.PreferencesManager.getPreferences();
        if (key in prefs) {
            const formattedKey = formatKey(key);
            const formattedValue = formatValue(key, prefs[key]);
            console.log(chalk_1.default.bold.cyan(`${formattedKey}: ${formattedValue}`));
        }
        else {
            console.log(chalk_1.default.red(`Unknown preference: ${key}`));
            console.log(chalk_1.default.gray('Use "yuangs preferences list" to see all available preferences.'));
        }
    });
    // Set a preference
    preferencesProgram
        .command('set <key> <value>')
        .description('Set a preference value')
        .action((key, value) => {
        const parsedValue = parseValue(key, value);
        if (parsedValue === null) {
            console.log(chalk_1.default.red(`Invalid value for ${key}: ${value}`));
            return;
        }
        preferences_1.PreferencesManager.setPreferences({ [key]: parsedValue });
        const formattedKey = formatKey(key);
        const formattedValue = formatValue(key, parsedValue);
        console.log(chalk_1.default.green(`✓ ${formattedKey} set to ${formattedValue}`));
    });
    // Reset preferences to defaults
    preferencesProgram
        .command('reset')
        .description('Reset all preferences to defaults')
        .option('-y, --yes', 'Skip confirmation')
        .action((options) => {
        if (!options.yes) {
            console.log(chalk_1.default.yellow('⚠️  This will reset all preferences to default values.'));
            console.log(chalk_1.default.gray('Use --yes to confirm.\n'));
            return;
        }
        preferences_1.PreferencesManager.resetPreferences();
        console.log(chalk_1.default.green('✓ All preferences reset to defaults'));
    });
    // Show current prompt personalization
    preferencesProgram
        .command('show-prompt')
        .description('Show current personalized prompt')
        .action(() => {
        const prefs = preferences_1.PreferencesManager.getPreferences();
        const basePrompt = '你是一个专业的技术助手（Yuangs AI），专精于软件开发、系统管理和问题解决。';
        const personalized = (0, preferences_1.buildPersonalizedPrompt)(basePrompt, prefs);
        console.log(chalk_1.default.bold.cyan('\n📝 Current Personalized Prompt\n'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(personalized);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });
    // Quick setup wizard
    preferencesProgram
        .command('setup')
        .description('Interactive preference setup')
        .action(async () => {
        const readline = (await Promise.resolve().then(() => __importStar(require('readline')))).createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const updates = {};
        console.log(chalk_1.default.bold.cyan('\n🔧 Yuangs AI Preference Setup\n'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        // Verbosity
        const verbosity = await ask(readline, 'Verbosity level (concise/normal/detailed) [default: normal]: ', 'normal');
        if (['concise', 'normal', 'detailed'].includes(verbosity)) {
            updates.verbosity = verbosity;
        }
        // Language
        const language = await ask(readline, 'Language (zh-CN/en-US/auto) [default: auto]: ', 'auto');
        if (['zh-CN', 'en-US', 'auto'].includes(language)) {
            updates.language = language;
        }
        // Explanation style
        const explanation = await ask(readline, 'Explanation style (technical/beginner/adaptive) [default: adaptive]: ', 'adaptive');
        if (['technical', 'beginner', 'adaptive'].includes(explanation)) {
            updates.explanation = explanation;
        }
        // Context strategy
        const contextStrategy = await ask(readline, 'Context strategy (smart/minimal/full) [default: smart]: ', 'smart');
        if (['smart', 'minimal', 'full'].includes(contextStrategy)) {
            updates.contextStrategy = contextStrategy;
        }
        // Auto-confirm
        const autoConfirm = await ask(readline, 'Auto-confirm commands (yes/no) [default: no]: ', 'no');
        if (['yes', 'no'].includes(autoConfirm)) {
            updates.autoConfirm = autoConfirm === 'yes';
        }
        readline.close();
        if (Object.keys(updates).length > 0) {
            preferences_1.PreferencesManager.setPreferences(updates);
            console.log(chalk_1.default.green('\n✓ Preferences updated successfully!'));
        }
        else {
            console.log(chalk_1.default.yellow('\nNo changes made.'));
        }
    });
}
function formatKey(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}
function formatValue(key, value) {
    if (typeof value === 'boolean') {
        return value ? chalk_1.default.green('enabled') : chalk_1.default.red('disabled');
    }
    if (typeof value === 'string') {
        return chalk_1.default.cyan(`"${value}"`);
    }
    return String(value);
}
function parseValue(key, value) {
    switch (key) {
        case 'verbosity':
            if (['concise', 'normal', 'detailed'].includes(value)) {
                return value;
            }
            return null;
        case 'language':
            if (['zh-CN', 'en-US', 'auto'].includes(value)) {
                return value;
            }
            return null;
        case 'codeStyle':
            if (['functional', 'imperative', 'any'].includes(value)) {
                return value;
            }
            return null;
        case 'explanation':
            if (['technical', 'beginner', 'adaptive'].includes(value)) {
                return value;
            }
            return null;
        case 'outputFormat':
            if (['markdown', 'plain', 'structured'].includes(value)) {
                return value;
            }
            return null;
        case 'contextStrategy':
            if (['smart', 'minimal', 'full'].includes(value)) {
                return value;
            }
            return null;
        case 'autoConfirm':
            if (['true', 'yes', '1', 'enabled'].includes(value.toLowerCase())) {
                return true;
            }
            if (['false', 'no', '0', 'disabled'].includes(value.toLowerCase())) {
                return false;
            }
            return null;
        default:
            return value;
    }
}
function ask(rl, question, defaultVal) {
    return new Promise((resolve) => {
        rl.question(`${chalk_1.default.cyan(question)}`, (answer) => {
            resolve(answer.trim() || defaultVal);
        });
    });
}
//# sourceMappingURL=preferencesCommands.js.map