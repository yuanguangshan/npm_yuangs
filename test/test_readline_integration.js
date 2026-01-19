const { createCompleter, detectMode, splitToken } = require('../dist/commands/shellCompletions.js');

// Test the readline integration aspects of completion
console.log('Testing readline integration for completion functionality...\n');

const completer = createCompleter();

// Test the splitToken function behavior
console.log('=== SPLIT TOKEN BEHAVIOR ===');
const splitTestCases = [
    '@',
    '@ ',
    '@ README',
    '@ README.md',
    '#',
    '# src',
    '# src/',
    '$ ls -l',
    'normal chat text'
];

splitTestCases.forEach(testCase => {
    const { prefix, token } = splitToken(testCase);
    console.log(`Input: "${testCase}"`);
    console.log(`  Prefix: "${prefix}"`);
    console.log(`  Token: "${token}"`);
    console.log(`  Mode: ${detectMode(testCase)}`);
    console.log('');
});

// Test actual completion behavior with various inputs
console.log('=== ACTUAL COMPLETION BEHAVIOR ===');
const completionTestCases = [
    '@',           // Should show all files
    '@ ',          // Should show all files (space after @)
    '@README',     // Should match README files
    '#',           // Should show all directories
    '# ',          // Should show all directories (space after #)
    '#src',        // Should match src directory
    '@ src/',      // Should show files in src directory
    '# src/'       // Should show subdirectories in src directory
];

completionTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        const { prefix, token } = splitToken(testCase);
        console.log(`  Split: prefix="${prefix}", token="${token}"`);
        console.log(`  Mode: ${detectMode(testCase)}`);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Returned line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Readline integration tests completed.');