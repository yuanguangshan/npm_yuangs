export type OSProfile = {
    name: string;
    shell: string;
    find: 'bsd' | 'gnu';
    stat: 'bsd' | 'gnu';
};

export function getOSProfile(): OSProfile {
    switch (process.platform) {
        case 'darwin':
            return {
                name: 'macOS',
                shell: 'zsh',
                find: 'bsd',
                stat: 'bsd',
            };
        case 'linux':
            return {
                name: 'Linux',
                shell: 'bash',
                find: 'gnu',
                stat: 'gnu',
            };
        case 'win32':
            return {
                name: 'Windows',
                shell: 'cmd',
                find: 'gnu', // Win32 find is different, but for AI context let's assume GNU style tools if they are there, or just label it.
                stat: 'gnu',
            };
        default:
            return {
                name: process.platform,
                shell: 'sh',
                find: 'gnu',
                stat: 'gnu',
            };
    }
}
