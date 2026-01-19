const { spawn } = require('child_process');

console.log('Test: Check for duplicate output in pipe mode\n');

const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

child.stdin.write('简短测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    // Count occurrences of "AI：" prefix
    const aiPrefixMatches = output.match(/AI：/g) || [];
    const aiPrefixCount = aiPrefixMatches.length;

    console.log(`AI prefix count: ${aiPrefixCount}`);

    if (aiPrefixCount > 1) {
        console.log(`❌ FAILED: Duplicate AI prefixes found (${aiPrefixCount} times)`);
        process.exit(1);
    } else if (aiPrefixCount === 1) {
        console.log('✓ PASSED: Only one AI prefix (no duplicates)');
        process.exit(0);
    } else {
        console.log('⚠️  WARNING: No AI prefix found');
        process.exit(1);
    }
});
