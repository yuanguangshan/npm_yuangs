import { ObservationNode } from '../knowledgeGraph/types';
export declare function recordObservationNode(input: {
    kind: ObservationNode['kind'];
    rawContent: string;
    originatingActionId?: string;
}): string;
