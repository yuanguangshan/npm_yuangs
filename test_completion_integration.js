const { createCompleter } = require('./dist/commands/shellCompletions.js');

// Test the completion functionality
console.log('Testing completion functionality...\n');

const completer = createCompleter();

// Test cases
const testCases = [
    '@',
    '#',
    '@ README',
    '# s',
    '$ ls',
    '! pwd'
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
        console.log(`  Completions: ${completions.length}`);
        console.log(`  Line: "${line}"`);
        if (completions.length > 0) {
            console.log(`  Sample: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Completion functionality test completed.');