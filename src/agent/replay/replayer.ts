import { RuntimeEvent } from './events';

export interface ReplayerOptions {
  speed?: number;
  stopOnError?: boolean;
  dryRun?: boolean;
}

export class EventReplayer {
  private events: RuntimeEvent[] = [];
  private currentIndex: number = 0;
  private options: Required<ReplayerOptions>;

  constructor(events: RuntimeEvent[], options: ReplayerOptions = {}) {
    this.events = events;
    this.options = {
      speed: options.speed || 1,
      stopOnError: options.stopOnError !== undefined ? options.stopOnError : true,
      dryRun: options.dryRun || false
    };
  }

  hasNext(): boolean {
    return this.currentIndex < this.events.length;
  }

  next(): RuntimeEvent | null {
    if (!this.hasNext()) {
      return null;
    }

    return this.events[this.currentIndex++];
  }

  reset(): void {
    this.currentIndex = 0;
  }

  async replay(onEvent: (event: RuntimeEvent, options: Required<ReplayerOptions>) => Promise<void>): Promise<void> {
    this.reset();
    let hasError = false;

    while (this.hasNext() && !hasError) {
      const event = this.next();

      if (!event) break;

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
      } catch (error: any) {
        console.error(`[Replay] Error at event ${event.id}:`, error.message);
        hasError = true;
      }
    }

    return;
  }

  getSummary(): {
    total: number;
    completed: number;
    errors: number;
  } {
    const errors = this.events.filter(e => e.type === 'error_occurred').length;
    
    return {
      total: this.events.length,
      completed: this.currentIndex,
      errors
    };
  }
}
