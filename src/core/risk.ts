export function assessRisk(command: string, aiRisk: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
    const highRiskCommands = ['rm ', 'sudo ', 'mv ', 'dd ', '> /dev/', ':(){ :|:& };:'];

    const hasHighRisk = highRiskCommands.some(cmd => command.includes(cmd));

    if (hasHighRisk) return 'high';
    return aiRisk;
}
