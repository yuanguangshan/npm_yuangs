/**
 * Test for AI chat display anomalies
 * This test simulates the display clearing logic to identify potential issues
 */

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

function simulateDisplayClearing(rawText, formattedText, screenWidth = 80) {
    const BOT_PREFIX = '🤖 AI：';
    const totalContent = BOT_PREFIX + rawText;
    const lineCount = getVisualLineCount(totalContent, screenWidth);

    console.log(`\n=== Display Clearing Simulation ===`);
    console.log(`Screen width: ${screenWidth}`);
    console.log(`Raw text length: ${rawText.length}`);
    console.log(`Calculated visual lines to clear: ${lineCount}`);

    console.log(`\nRaw output would be cleared using:`);
    console.log(`  1. Clear current line (\\r\\x1b[K)`);
    console.log(`  2. Move up and clear ${lineCount - 1} more lines`);

    console.log(`\nFormatted output length: ${formattedText.length}`);

    const formattedVisualLines = getVisualLineCount(BOT_PREFIX + formattedText, screenWidth);
    console.log(`Formatted output visual lines: ${formattedVisualLines}`);

    if (lineCount !== formattedVisualLines) {
        console.log(`⚠️  WARNING: Line count mismatch!`);
        console.log(`   Raw: ${lineCount} lines, Formatted: ${formattedVisualLines} lines`);
        return { success: false, rawLines: lineCount, formattedLines: formattedVisualLines };
    }

    return { success: true, rawLines: lineCount, formattedLines: formattedVisualLines };
}

const testCases = [
    {
        name: "Simple text",
        raw: "Hello world",
        formatted: "Hello world"
    },
    {
        name: "Text exactly at screen width",
        raw: "A".repeat(70),
        formatted: "A".repeat(70)
    },
    {
        name: "Text that wraps exactly once",
        raw: "B".repeat(90),
        formatted: "B".repeat(90)
    },
    {
        name: "Multiple lines",
        raw: "Line 1\nLine 2\nLine 3",
        formatted: "Line 1\nLine 2\nLine 3"
    },
    {
        name: "Text with markdown formatting (adds characters)",
        raw: "**Bold** and *italic* text",
        formatted: "**Bold** and *italic* text"
    },
    {
        name: "Long markdown text",
        raw: "This is a long paragraph that should wrap across multiple lines when displayed in the terminal. It contains various words and phrases to test the wrapping behavior.",
        formatted: "This is a long paragraph that should wrap across multiple lines when displayed in the terminal. It contains various words and phrases to test the wrapping behavior."
    },
    {
        name: "Code block (may have different visual height)",
        raw: "Here's some code:\nconst x = 1;\nconst y = 2;",
        formatted: "Here's some code:\nconst x = 1;\nconst y = 2;"
    },
    {
        name: "CJK text (2-cell characters)",
        raw: "这是一段中文文本，测试显示效果。这段文字应该能够正确处理中文字符。",
        formatted: "这是一段中文文本，测试显示效果。这段文字应该能够正确处理中文字符。"
    }
];

console.log("\n" + "=".repeat(80));
console.log("AI Chat Display Anomaly Test");
console.log("=".repeat(80));

let failures = 0;
testCases.forEach(test => {
    const result = simulateDisplayClearing(test.raw, test.formatted);
    if (!result.success) {
        failures++;
        console.log(`\n❌ FAILED: ${test.name}`);
    } else {
        console.log(`\n✓ PASSED: ${test.name}`);
    }
});

console.log("\n" + "=".repeat(80));
console.log(`Test Summary: ${testCases.length - failures}/${testCases.length} passed`);
console.log("=".repeat(80) + "\n");

if (failures > 0) {
    console.log(`⚠️  ${failures} test(s) failed due to line count mismatch`);
    console.log(`\nPotential issues:`);
    console.log(`  1. The clearing logic might not clear enough lines`);
    console.log(`  2. The visual line count calculation might be inaccurate`);
    console.log(`  3. Formatted output might have different visual height than raw`);
    process.exit(1);
} else {
    console.log("✓ All display clearing tests passed");
    process.exit(0);
}
