function stripAnsi(str) {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function getVisualLineCount(text, screenWidth) {
    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
        const expandedLine = line.replace(/\t/g, '        ');
        const cleanLine = stripAnsi(expandedLine);

        let lineWidth = 0;
        for (const char of cleanLine) {
            const code = char.codePointAt(0) || 0;
            lineWidth += code > 255 ? 2 : 1;
        }

        if (lineWidth === 0) {
            totalLines += 1;
        } else {
            totalLines += Math.ceil(lineWidth / screenWidth);
        }
    }

    return totalLines;
}

const testCases = [
    { name: "Simple short text", text: "Hello world", screenWidth: 80 },
    { name: "Text that exactly fills one line", text: "A".repeat(80), screenWidth: 80 },
    { name: "Text that exceeds one line", text: "B".repeat(100), screenWidth: 80 },
    { name: "Multiple lines", text: "Line 1\nLine 2\nLine 3", screenWidth: 80 },
    { name: "Text with ANSI codes (colors)", text: "\x1b[31mRed text\x1b[0m and normal text", screenWidth: 80 },
    { name: "CJK characters (2 cells each)", text: "中文字符测试".repeat(20), screenWidth: 80 },
    { name: "Emoji characters (2 cells each)", text: "😀😁😂🤣😃".repeat(20), screenWidth: 80 },
    { name: "Mixed content", text: "Normal text with 中文 and 😀😁 emojis and \x1b[31mcolors\x1b[0m", screenWidth: 80 }
];

console.log("Testing visual line count calculation\n");
console.log("=".repeat(80));

testCases.forEach(test => {
    const lineCount = getVisualLineCount(test.text, test.screenWidth);
    const strippedLength = stripAnsi(test.text).length;

    console.log(`\nTest: ${test.name}`);
    console.log(`Screen width: ${test.screenWidth}`);
    console.log(`Text length (without ANSI): ${strippedLength}`);
    console.log(`Calculated visual lines: ${lineCount}`);
    console.log(`Preview: ${test.text.substring(0, 50)}${test.text.length > 50 ? '...' : ''}`);
});

console.log("\n" + "=".repeat(80));
console.log("\n✓ All tests completed\n");

console.log("\nSimulating cursor clearing logic:");
console.log("=".repeat(80));

const sampleText = "This is a test of the clearing logic\nWith multiple lines\nAnd some wrapping text that goes on for a while and should wrap around the screen";
const screenWidth = 80;
const lineCount = getVisualLineCount(sampleText, screenWidth);

console.log(`\nSample text:\n${sampleText}`);
console.log(`\nCalculated visual lines: ${lineCount}`);
console.log(`Cursor would move up: ${lineCount - 1} times`);

if (lineCount > 0) {
    console.log(`\n⚠️  Note: The clearing logic uses ${lineCount - 1} iterations.`);
    console.log(`   If the cursor is at the end of the last line, it needs to:`);
    console.log(`   1. Clear current line`);
    console.log(`   2. Move up and clear ${lineCount - 1} more lines`);
    console.log(`   Total: ${lineCount} lines cleared ✓`);
} else {
    console.log(`\n❌ ERROR: Line count is 0 or negative!`);
}
