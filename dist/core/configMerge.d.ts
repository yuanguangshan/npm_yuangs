export type ConfigSource = 'built-in' | 'user-global' | 'project' | 'command-override';
export interface ConfigFieldSource<T = unknown> {
    value: T;
    source: ConfigSource;
    filePath?: string;
}
export interface MergedConfig {
    aiProxyUrl: ConfigFieldSource<string>;
    defaultModel: ConfigFieldSource<string>;
    accountType: ConfigFieldSource<'free' | 'pro'>;
    [key: string]: ConfigFieldSource<unknown>;
}
export declare function loadConfigAt(filePath: string): Record<string, unknown> | null;
export declare function mergeConfigs(builtin: Record<string, unknown>, userGlobal: Record<string, unknown> | null, project: Record<string, unknown> | null, commandOverride: Record<string, unknown> | null): MergedConfig;
export declare function dumpConfigSnapshot(config: MergedConfig): string;
export declare function getConfigFilePaths(): {
    userGlobal: string;
    project: string | null;
};
