import { Policy, PolicyContext, PolicyResult } from '../types';
export declare class NoDangerousShellPolicy implements Policy {
    name: string;
    description: string;
    evaluate(context: PolicyContext): PolicyResult;
}
export declare const noDangerousShellPolicy: NoDangerousShellPolicy;
