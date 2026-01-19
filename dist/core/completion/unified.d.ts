import { Command } from 'commander';
export declare function complete(req: any): Promise<any>;
export declare function getCommandSubcommands(program: Command, commandName: string): any[];
export declare function setProgramInstance(program: any): void;
