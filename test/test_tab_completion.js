/**
 * Test tab completion logic
 */

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

function testCompleter(line) {
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
}

console.log('Testing tab completion logic\n');

const testCases = [
    '@',
    '#',
    '@ src',
    '# s',
    '@ README',
];

testCases.forEach(testLine => {
    console.log(`\nInput: "${testLine}"`);
    const [completions, hit] = testCompleter(testLine);
    console.log(`Hit: "${hit}"`);
    console.log(`Completions (${completions.length}):`);
    completions.slice(0, 10).forEach(c => {
        console.log(`  - ${c}`);
    });
    if (completions.length > 10) {
        console.log(`  ... and ${completions.length - 10} more`);
    }
});

console.log('\n✓ Tab completion logic tests completed');
