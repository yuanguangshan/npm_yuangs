const getVisualLineCount = (text, columns = 20) => {
    const lines = text.split('\n');
    let totalLines = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
        let visualWidth = 0;
        for (let j = 0; j < cleanLine.length; j++) {
            visualWidth += cleanLine.charCodeAt(j) > 255 ? 2 : 1;
        }
        const consumed = Math.max(1, Math.ceil(visualWidth / columns));
        totalLines += consumed;
        console.log(`Line ${i}: "${line}" (width ${visualWidth}) -> consumed ${consumed}`);
    }
    return totalLines;
};

console.log('--- Test 1: "Hello" ---');
console.log('Total:', getVisualLineCount('Hello'));

console.log('--- Test 2: "Hello\\n" ---');
console.log('Total:', getVisualLineCount('Hello\n'));

console.log('--- Test 3: 25 chars in 20 width ---');
console.log('Total:', getVisualLineCount('a'.repeat(25)));
