const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure there is some history to test with
const historyFile = path.join(os.homedir(), '.yuangs_cmd_history.json');
const dummyHistory = [
    { question: "First command", command: "echo 'I am command 1'", time: "Now" },
    { question: "Second command", command: "echo 'I am command 2'", time: "Now" },
    { question: "Third command", command: "echo 'I am command 3'", time: "Now" }
];

// Backup existing history if any
let backupHistory = null;
if (fs.existsSync(historyFile)) {
    backupHistory = fs.readFileSync(historyFile);
}
fs.writeFileSync(historyFile, JSON.stringify(dummyHistory));

const cliPath = path.join(__dirname, '..', 'dist/cli.js');
const child = spawn('node', [cliPath, 'history'], { stdio: 'pipe' });

let output = '';
let step = 0;

child.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    console.log(`[CLI Output] ${str}`);

    // Step 1: Wait for prompt and send index '2' (Select second item)
    if (step === 0 && str.includes('输入序号')) {
        console.log('[Test] Sending "2"... (Selecting second item)');
        child.stdin.write('2\n');
        step++;
    }

    // Step 2: Wait for confirmation prompt and send 'y'
    if (step === 1 && str.includes('确认执行')) {
        console.log('[Test] Confirming execution...');
        child.stdin.write('y\n');
        step++;
    }
});

child.stderr.on('data', (data) => {
    console.error(`[CLI Error] ${data}`);
});

child.on('close', (code) => {
    console.log(`[Test] Process exited with code ${code}`);
    
    // Restore history
    if (backupHistory) {
        fs.writeFileSync(historyFile, backupHistory);
    } else {
        fs.unlinkSync(historyFile);
    }

    if (output.includes('I am command 2')) {
        console.log('✅ Interactive Multi-Item History Test PASSED');
    } else {
        console.log('❌ Interactive Multi-Item History Test FAILED');
    }
});