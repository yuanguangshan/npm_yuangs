import { RuntimeEvent } from './events';
export interface ReplayerOptions {
    speed?: number;
    stopOnError?: boolean;
    dryRun?: boolean;
}
export declare class EventReplayer {
    private events;
    private currentIndex;
    private options;
    constructor(events: RuntimeEvent[], options?: ReplayerOptions);
    hasNext(): boolean;
    next(): RuntimeEvent | null;
    reset(): void;
    replay(onEvent: (event: RuntimeEvent, options: Required<ReplayerOptions>) => Promise<void>): Promise<void>;
    getSummary(): {
        total: number;
        completed: number;
        errors: number;
    };
}
