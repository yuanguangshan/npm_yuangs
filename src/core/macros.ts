import fs from 'fs';
import path from 'path';
import os from 'os';

const MACROS_FILE = path.join(os.homedir(), '.yuangs_macros.json');

export type Macro = {
    commands: string;
    description: string;
    createdAt: string;
};

export function getMacros(): Record<string, Macro> {
    if (fs.existsSync(MACROS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(MACROS_FILE, 'utf8'));
        } catch (e) { }
    }
    return {};
}

export function saveMacro(name: string, commands: string, description: string = '') {
    const macros = getMacros();
    macros[name] = {
        commands,
        description,
        createdAt: new Date().toISOString()
    };
    fs.writeFileSync(MACROS_FILE, JSON.stringify(macros, null, 2));
    return true;
}

export function deleteMacro(name: string) {
    const macros = getMacros();
    if (macros[name]) {
        delete macros[name];
        fs.writeFileSync(MACROS_FILE, JSON.stringify(macros, null, 2));
        return true;
    }
    return false;
}

export function runMacro(name: string) {
    const macros = getMacros();
    const macro = macros[name];
    if (!macro) return false;

    const { spawn } = require('child_process');
    spawn(macro.commands, [], { shell: true, stdio: 'inherit' });
    return true;
}
