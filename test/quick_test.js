const { spawn } = require('child_process');

console.log('Quick test for escape sequences after fix\n');

const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

child.stdin.write('简短测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    const escapeSequenceCount = (output.match(/\x1b/g) || []).length;
    console.log('Escape sequences found:', escapeSequenceCount);

    if (escapeSequenceCount > 5) {
        console.log('❌ Still has escape sequences');
    } else if (escapeSequenceCount > 0) {
        console.log('⚠️  Few escape sequences (might be chalk colors)');
    } else {
        console.log('✓ No problematic escape sequences');
    }
});
