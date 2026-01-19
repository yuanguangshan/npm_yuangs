/**
 * Interactive test for tab completion
 * This test simulates how the completer would be called in real usage
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

function findCommonPrefix(strings) {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let common = '';
    const first = strings[0];

    for (let i = 0; i < first.length; i++) {
        const char = first[i];
        if (strings.every(s => s[i] === char)) {
            common += char;
        } else {
            break;
        }
    }

    return common;
}

function createCompleter() {
    return (line) => {
        if (!line.startsWith('@') && !line.startsWith('#')) {
            return [[], line];
        }

        const isFileMode = line.startsWith('@');
        const prefix = isFileMode ? '@ ' : '# ';
        const inputAfterPrefix = line.substring(prefix.length);

        if (!inputAfterPrefix) {
            const currentDir = process.cwd();
            const files = fs.readdirSync(currentDir);
            const completions = isFileMode
                ? files.filter(f => {
                    const fullPath = path.join(currentDir, f);
                    return fs.statSync(fullPath).isFile();
                })
                : files.filter(f => {
                    const fullPath = path.join(currentDir, f);
                    return fs.statSync(fullPath).isDirectory();
                });
            return [completions.map(c => prefix + c), prefix];
        }

        const parts = inputAfterPrefix.split(path.sep);
        const partialName = parts[parts.length - 1];
        const basePath = parts.slice(0, -1).join(path.sep);
        const searchPath = basePath ? path.resolve(basePath) : process.cwd();

        if (!fs.existsSync(searchPath) || !fs.statSync(searchPath).isDirectory()) {
            return [[], line];
        }

        const files = fs.readdirSync(searchPath);
        const completions = files
            .filter(f => {
                const fullPath = path.join(searchPath, f);
                const isDir = fs.statSync(fullPath).isDirectory();
                const matchesPrefix = f.toLowerCase().startsWith(partialName.toLowerCase());

                if (isFileMode) {
                    return matchesPrefix && !isDir;
                } else {
                    return matchesPrefix && isDir;
                }
            })
            .map(f => {
                const fullPath = path.join(searchPath, f);
                const isDir = fs.statSync(fullPath).isDirectory();
                return isDir ? f + path.sep : f;
            });

        const commonPrefix = completions.length === 1
            ? completions[0]
            : findCommonPrefix(completions);

        const newLine = basePath
            ? prefix + basePath + path.sep + commonPrefix
            : prefix + commonPrefix;

        return [completions.map(c => {
            const fullCompletion = basePath
                ? prefix + basePath + path.sep + c
                : prefix + c;
            return fullCompletion;
        }), newLine];
    };
}

const completer = createCompleter();

console.log('Tab Completion Interactive Test\n');
console.log('This simulates the completion behavior in handleAIChat.ts\n');

console.log('\nTest 1: @ (files only)');
const [completions1, hit1] = completer('@');
console.log(`  Hit: "${hit1}"`);
console.log(`  Completions: ${completions1.slice(0, 5).join(', ')}${completions1.length > 5 ? '...' : ''}\n`);

console.log('Test 2: # (directories only)');
const [completions2, hit2] = completer('#');
console.log(`  Hit: "${hit2}"`);
console.log(`  Completions: ${completions2.slice(0, 5).join(', ')}${completions2.length > 5 ? '...' : ''}\n`);

console.log('Test 3: @ src/ (files in src directory)');
const [completions3, hit3] = completer('@ src/');
console.log(`  Hit: "${hit3}"`);
console.log(`  Completions: ${completions3.slice(0, 5).join(', ')}${completions3.length > 5 ? '...' : ''}\n`);

console.log('Test 4: @ .git (no completions, .git is a directory)');
const [completions4, hit4] = completer('@ .git');
console.log(`  Hit: "${hit4}"`);
console.log(`  Completions: ${completions4.length > 0 ? completions4.slice(0, 5).join(', ') : '(none)'}\n`);

console.log('✓ All tests completed successfully!');
console.log('\nTo test in real mode:');
console.log('  1. Run: npm run dev -- ai');
console.log('  2. Type: @ and press Tab');
console.log('  3. Type: # and press Tab');
console.log('  4. Type: @ src/ and press Tab');
