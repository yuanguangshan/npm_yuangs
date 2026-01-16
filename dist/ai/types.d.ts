export type AICommandPlan = {
    plan: string;
    command: string;
    risk: 'low' | 'medium' | 'high';
};
