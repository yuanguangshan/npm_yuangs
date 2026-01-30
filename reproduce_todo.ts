
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const METADATA_PREFIX = '>';

const METADATA_PARSERS: Record<string, any> = {
    'Capability Level:': (line: string, metadata: any) => {
        const capabilityStr = line.split(':', 2)[1]?.trim();
        metadata.capabilityStr = capabilityStr;
    },
    'Estimated Time:': (line: string, metadata: any) => {
        const timeMatch = line.match(/(\d+)\s*ms/i);
        if (timeMatch) metadata.estimatedTime = parseInt(timeMatch[1], 10);
    },
    'Estimated Tokens:': (line: string, metadata: any) => {
        const tokensMatch = line.match(/(\d+)/);
        if (tokensMatch) metadata.estimatedTokens = parseInt(tokensMatch[1], 10);
    },
    'Scope:': (line: string, metadata: any) => {
        const scopeStr = line.split(':', 2)[1]?.trim().toLowerCase();
        metadata.scope = scopeStr;
    }
};

function parseMetadataLine(line: string, metadata: any): boolean {
    for (const [prefix, parser] of Object.entries(METADATA_PARSERS)) {
        if (line.includes(prefix)) {
            parser(line, metadata);
            return true;
        }
    }
    return false;
}

async function loadPlanFromTodo(todoPath: string) {
    try {
        const content = await fs.promises.readFile(todoPath, 'utf8');
        console.log(`Read content length: ${content.length}`);
        const lines = content.split('\n');
        
        const planContent: string[] = [];
        let metadata: any = {};
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith(METADATA_PREFIX)) {
                // 解析元数据行
                const metadataLine = trimmedLine.replace(METADATA_PREFIX, '').trim();
                console.log(`Parsing metadata line: ${metadataLine}`);
                parseMetadataLine(metadataLine, metadata);
            } else if (trimmedLine) {
                planContent.push(line);
            }
        }

        console.log(`Plan content lines: ${planContent.length}`);
        console.log(`Metadata:`, metadata);

        if (planContent.length === 0) {
            console.warn(chalk.yellow('⚠️  todo.md 文件内容为空'));
            return null;
        }
        
        return {
            todoMarkdown: planContent.join('\n'),
            ...metadata
        };
    } catch (e: any) {
        console.error('Error:', e.message);
        return null;
    }
}

// Run
const todoPath = path.join(process.cwd(), 'todo.md');
loadPlanFromTodo(todoPath).then(res => {
    if (res) console.log('Successfully loaded plan');
    else console.log('Failed to load plan');
});
