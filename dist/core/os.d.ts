export type OSProfile = {
    name: string;
    shell: string;
    find: 'bsd' | 'gnu';
    stat: 'bsd' | 'gnu';
};
export declare function getOSProfile(): OSProfile;
