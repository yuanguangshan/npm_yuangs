"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventReplayer = void 0;
class EventReplayer {
    events = [];
    currentIndex = 0;
    options;
    constructor(events, options = {}) {
        this.events = events;
        this.options = {
            speed: options.speed || 1,
            stopOnError: options.stopOnError !== undefined ? options.stopOnError : true,
            dryRun: options.dryRun || false
        };
    }
    hasNext() {
        return this.currentIndex < this.events.length;
    }
    next() {
        if (!this.hasNext()) {
            return null;
        }
        return this.events[this.currentIndex++];
    }
    reset() {
        this.currentIndex = 0;
    }
    async replay(onEvent) {
        this.reset();
        let hasError = false;
        while (this.hasNext() && !hasError) {
            const event = this.next();
            if (!event)
                break;
            try {
                await onEvent(event, this.options);
                if (event.type === 'error_occurred') {
                    hasError = true;
                    if (this.options.stopOnError) {
                        break;
                    }
                }
                if (this.options.speed > 1) {
                    const delay = 100 / this.options.speed;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            catch (error) {
                console.error(`[Replay] Error at event ${event.id}:`, error.message);
                hasError = true;
            }
        }
        return;
    }
    getSummary() {
        const errors = this.events.filter(e => e.type === 'error_occurred').length;
        return {
            total: this.events.length,
            completed: this.currentIndex,
            errors
        };
    }
}
exports.EventReplayer = EventReplayer;
//# sourceMappingURL=replayer.js.map