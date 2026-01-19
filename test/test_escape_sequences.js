const { spawn } = require('child_process');

console.log('Testing escape sequence visibility in different contexts\n');

console.log('=== Test 1: Direct TTY output (if available) ===');
if (process.stdout.isTTY) {
    console.log('stdout is a TTY');
    console.log('Writing escape sequence: \\x1b[A (cursor up)');
    process.stdout.write('\x1b[A');
    console.log('\n(You should see "Test 2" appear above this line)\n');
} else {
    console.log('stdout is NOT a TTY (pipelined output)');
    console.log('Escape sequences will be visible as text\n');
}

console.log('=== Test 2: Piped output (non-TTY) ===');
const child = spawn('npm', ['run', 'dev', '--', '-p'], {
    stdio: ['pipe', 'pipe', 'inherit']
});

child.stdin.write('测试\n');
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    console.log('\n=== Analysis ===');
    console.log('Exit code:', code);

    const escapeSequenceCount = (output.match(/\x1b/g) || []).length;
    console.log('Escape sequences found:', escapeSequenceCount);

    if (escapeSequenceCount > 0) {
        console.log('\n❌ ISSUE DETECTED: Escape sequences are visible in output!');
        console.log('This causes display anomalies in piped/non-TTY mode.');
    } else {
        console.log('\n✓ No escape sequences found in output');
    }
});

child.on('error', (err) => {
    console.error('Error:', err);
});
