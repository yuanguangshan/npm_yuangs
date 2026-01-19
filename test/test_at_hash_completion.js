const { createCompleter } = require('../dist/commands/shellCompletions.js');

// Test the @ and # completion functionality specifically
console.log('Testing @ and # completion functionality...\n');

const completer = createCompleter();

// Test cases for @ (files) and # (directories)
const fileTestCases = [
    '@',
    '@ R',
    '@ README',
    '@ package',
    '@ ./s',  // test subdirectory
    '@ src/'  // test specific directory
];

const dirTestCases = [
    '#',
    '# s',
    '# src',
    '# d',
    '# ./s',  // test subdirectory
    '# dist/' // test specific directory
];

console.log('=== FILE COMPLETION TESTS (@) ===');
fileTestCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    try {
        const [completions, line] = completer(testCase);
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

console.log('File and directory completion tests completed.');