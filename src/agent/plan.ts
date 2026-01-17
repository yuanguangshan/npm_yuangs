export interface AgentPlan {
    goal: string;
    tasks: AgentTask[];
}

export interface AgentTask {
    id: string;
    description: string;
    type: 'llm' | 'shell' | 'custom';
    dependsOn?: string[];
    payload?: any;
    status: 'pending' | 'running' | 'success' | 'failed';
    result?: any;
}
