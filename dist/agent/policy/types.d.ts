export interface PolicyContext {
    action: {
        type: string;
        payload: any;
    };
    user?: {
        permissions: string[];
    };
    environment?: {
        isProduction: boolean;
    };
}
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
    requiresEscalation?: boolean;
    suggestedActions?: string[];
}
export interface Policy {
    name: string;
    description: string;
    evaluate(context: PolicyContext): PolicyResult | Promise<PolicyResult>;
}
