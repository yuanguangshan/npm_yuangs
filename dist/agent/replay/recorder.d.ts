import { RuntimeEvent, EventRecorder } from './events';
export declare class FileEventRecorder implements EventRecorder {
    private events;
    private logFile;
    private flushInterval;
    constructor(logDir?: string);
    record(event: RuntimeEvent): Promise<void>;
    flush(): Promise<void>;
    getEvents(executionId?: string): RuntimeEvent[];
}
export declare const createEvent: (executionId: string, type: RuntimeEvent["type"], data: RuntimeEvent["data"], metadata?: RuntimeEvent["metadata"]) => RuntimeEvent;
