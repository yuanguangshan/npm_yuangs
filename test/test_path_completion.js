const { createCompleter, detectMode } = require('../dist/commands/shellCompletions.js');

// Test path completion without spaces
console.log('Testing path completion without spaces...\n');

const completer = createCompleter();

// Test path completion without spaces (proper format)
console.log('=== PATH COMPLETION WITHOUT SPACES ===');
const pathTests = [
    '@./',      // Current directory files
    '#./',      // Current directory dirs
    '@/tmp',    // Absolute path (may not exist)
    '#/tmp',    // Absolute path (may not exist)
    '@src/',    // src directory files
    '#src/',    // src directory dirs
    '@package.', // Files starting with package
    '#d'        // Directories starting with d
];

pathTests.forEach(test => {
    console.log(`Input: "${test}"`);
    try {
        const [completions, line] = completer(test);
        console.log(`  Mode: ${detectMode(test)}`);
        console.log(`  Completions: ${completions.length}`);
        if (completions.length > 0) {
            console.log(`  First 3: ${completions.slice(0, 3).join(', ')}`);
        }
    } catch (error) {
        console.log(`  Error: ${error.message}`);
    }
    console.log('');
});

console.log('Path completion tests completed.');