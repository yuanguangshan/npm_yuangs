const { createCompleter, detectMode } = require('../dist/commands/shellCompletions.js');

// Test the mode detection and completion functionality
console.log('Testing mode detection and completion functionality...\n');

const completer = createCompleter();

// Test mode detection
const modeTestCases = [
    '@',
    '@ ',
    '@ README',
    '@ README.md',
    '#',
    '# ',
    '# src',
    '# src/',
    '$ ls',
    '! pwd',
    'hello world'
];

console.log('=== MODE DETECTION TESTS ===');
modeTestCases.forEach(testCase => {
    const mode = detectMode(testCase);
    console.log(`Input: "${testCase}" -> Mode: ${mode}`);
});

console.log('');

// Test cases for @ (files) and # (directories) - corrected format
const fileTestCases = [
    '@',      // Just @ should trigger file completion
    '@ ',     // @ followed by space
    '@./',    // @ followed by path
    '@/home/', // Absolute path
];

const dirTestCases = [
    '#',      // Just # should trigger dir completion
    '# ',     // # followed by space
    '#./',    // # followed by path
    '#/home/', // Absolute path
];

console.log('=== FILE COMPLETION TESTS (@) ===');
fileTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Mode detected: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('=== DIRECTORY COMPLETION TESTS (#) ===');
dirTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Mode detected: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Mode detection and completion tests completed.');