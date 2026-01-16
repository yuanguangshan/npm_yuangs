const fs = require('fs');
const yuangs = require('../dist/core/macros');
const path = require('path');
const os = require('os');

jest.mock('fs');

describe('Module: Macros', () => {
    const mockMacrosFile = path.join(os.homedir(), '.yuangs_macros.json');

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock implementation
        fs.existsSync.mockReturnValue(false);
        fs.readFileSync.mockReturnValue('{}');
        fs.writeFileSync.mockReturnValue(undefined);
        // We need to unmock path and os if they were mocked, but we only mocked fs
    });

    test('should get empty macros when file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        const macros = yuangs.getMacros();
        expect(macros).toEqual({});
        expect(fs.existsSync).toHaveBeenCalledWith(mockMacrosFile);
    });

    test('should save a new macro', () => {
        fs.existsSync.mockReturnValue(false); // File doesn't exist yet
        
        const result = yuangs.saveMacro('test', 'echo hello', 'description');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        expect(filePath).toBe(mockMacrosFile);
        
        const data = JSON.parse(content);
        expect(data).toHaveProperty('test');
        expect(data.test.commands).toBe('echo hello');
        expect(data.test.description).toBe('description');
        expect(data.test).toHaveProperty('createdAt');
    });

    test('should retrieve existing macros', () => {
        const mockData = {
            "demo": {
                "commands": "ls -la",
                "description": "list files",
                "createdAt": "2024-01-01T00:00:00.000Z"
            }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const macros = yuangs.getMacros();
        expect(macros).toEqual(mockData);
    });

    test('should delete a macro', () => {
        const mockData = {
            "todelete": { "commands": "rm -rf /", "description": "dangerous", "createdAt": "2024-01-01T00:00:00.000Z" },
            "keep": { "commands": "echo safe", "description": "safe", "createdAt": "2024-01-01T00:00:00.000Z" }
        };
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

        const result = yuangs.deleteMacro('todelete');
        
        expect(result).toBe(true);
        expect(fs.writeFileSync).toHaveBeenCalled();
        
        const [filePath, content] = fs.writeFileSync.mock.calls[0];
        const savedData = JSON.parse(content);
        expect(savedData).not.toHaveProperty('todelete');
        expect(savedData).toHaveProperty('keep');
    });

    test('should return false when deleting non-existent macro', () => {
        fs.existsSync.mockReturnValue(false); // Or true with empty object
        
        const result = yuangs.deleteMacro('nonexistent');
        expect(result).toBe(false);
        // Should not write to disk if nothing changed (optional optimization, but current implementation reads first)
        // Actually current implementation:
        // const macros = getMacros();
        // if (macros[name]) { ... }
        // getMacros returns {} if file not exists. macros['nonexistent'] is undefined.
        // So it returns false and does NOT call writeFileSync.
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});
