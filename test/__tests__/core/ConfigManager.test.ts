import { ConfigManager } from '../../../src/core/ConfigManager';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    promises: {
        readFile: jest.fn(),
    },
    mkdirSync: jest.fn(),
}));

jest.mock('js-yaml', () => ({
    load: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockReadFile = fs.promises.readFile as jest.Mock;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('ConfigManager', () => {
    let configManager: ConfigManager;
    const mockCwd = '/fake/cwd';

    beforeEach(() => {
        jest.clearAllMocks();
        configManager = new ConfigManager(mockCwd);
    });

    test('should load default config if no file exists', async () => {
        mockFs.existsSync.mockReturnValue(false);

        await configManager.init();

        expect(configManager.get('git.auto.maxTasks')).toBe(5);
        expect(configManager.getConfigPath()).toBeNull();
    });

    test('should load and merge JSON config', async () => {
        const configPath = path.join(mockCwd, '.yuangsrc.json');
        mockFs.existsSync.mockImplementation((p: any) => p === configPath);
        mockReadFile.mockResolvedValue(JSON.stringify({
            git: { auto: { maxTasks: 10 } },
            ui: { theme: 'dark' }
        }));

        await configManager.init();

        expect(configManager.get('git.auto.maxTasks')).toBe(10);
        expect(configManager.get('git.auto.model')).toBe('Assistant'); // from default
        expect(configManager.get('ui.theme')).toBe('dark');
        expect(configManager.getConfigPath()).toBe(configPath);
    });

    test('should load and merge YAML config', async () => {
        const configPath = path.join(mockCwd, '.yuangsrc.yaml');
        mockFs.existsSync.mockImplementation((p: any) => p === configPath);
        mockReadFile.mockResolvedValue('git:\n  auto:\n    maxTasks: 20');
        mockYaml.load.mockReturnValue({ git: { auto: { maxTasks: 20 } } });

        await configManager.init();

        expect(configManager.get('git.auto.maxTasks')).toBe(20);
        expect(mockYaml.load).toHaveBeenCalled();
    });

    test('should throw ConfigError on invalid content', async () => {
        const configPath = path.join(mockCwd, '.yuangsrc.json');
        mockFs.existsSync.mockReturnValue(true);
        mockReadFile.mockResolvedValue('invalid json');

        await expect(configManager.init()).rejects.toThrow('Failed to load config');
    });
});
