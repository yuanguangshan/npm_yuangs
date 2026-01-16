const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure there is some history to test with
const historyFile = path.join(os.homedir(), '.yuangs_cmd_history.json');
const dummyHistory = [
    { question: "Test Question", command: "echo 'History Test Success'", time: "Now" }
];

// Backup existing history if any
let backupHistory = null;
if (fs.existsSync(historyFile)) {
    backupHistory = fs.readFileSync(historyFile);
}
fs.writeFileSync(historyFile, JSON.stringify(dummyHistory));

const cliPath = path.join(__dirname, 'cli.js');
const child = spawn('node', [cliPath, 'history'], { stdio: 'pipe' });

let output = '';
let step = 0;

child.stdout.on('data', (data) => {
    const str = data.toString();
    output += str;
    console.log(`[CLI Output] ${str}`);

    // Step 1: Wait for prompt and send index '1'
    if (step === 0 && str.includes('输入序号')) {
        console.log('[Test] Sending "1"...');
        child.stdin.write('1\n');
        step++;
    }

    // Step 2: Wait for pre-fill confirmation (readline write)
    // Note: Since we are in a non-TTY pipe, readline.write might behave differently or just output the text.
    // In our code: rlHistory.write(targetCommand) -> outputs to stdout.
    if (step === 1 && str.includes('echo \'History Test Success\'')) {
        console.log('[Test] Command pre-filled. Sending Enter to execute...');
        child.stdin.write('\n');
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

    if (output.includes('History Test Success')) {
        console.log('✅ Interactive History Test PASSED');
    } else {
        console.log('❌ Interactive History Test FAILED');
    }
});
