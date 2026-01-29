import { GitService } from '../git/GitService';
import { ContextGatherer } from '../git/ContextGatherer';
import { CodeReviewer, ReviewLevel } from '../git/CodeReviewer';
import { runLLM, AIError } from '../../agent/llm';
import { AIRequestMessage } from '../../core/validation';
import { MAX_RETRY_ATTEMPTS, MIN_REVIEW_SCORE } from '../git/constants';
import {
  parseGeneratedCode,
  writeGeneratedCode,
  saveRawOutput,
  backupFiles
} from '../git/CodeGenerator';
import { CommitMessageGenerator } from '../git/CommitMessageGenerator';
import {
  parseTodoFile,
  updateTaskStatus,
  getNextTask,
  TaskStatus
} from '../git/TodoManager';
import {
  AutoInput,
  AutoOutput,
  WorkflowConfig,
  WorkflowResult,
  WorkflowError,
  workflowSuccess,
  workflowFailure
} from './types';
import { getRouter } from '../modelRouter';

export interface AutoWorkflowProgress {
  currentTask?: number;
  executedTasks: number;
  backupIds: string[];
  filesModified: string[];
}

export class AutoWorkflow {
  constructor(
    private gitService: GitService,
    private contextGatherer: ContextGatherer,
    private codeReviewer: CodeReviewer
  ) {}

  async run(input: AutoInput, config: WorkflowConfig): Promise<WorkflowResult<AutoOutput>> {
    try {
      const maxTasks = input.maxTasks || 5;
      const progress: AutoWorkflowProgress = {
        executedTasks: 0,
        backupIds: [],
        filesModified: []
      };

      const todoPath = process.cwd() + '/todo.md';
      const { tasks } = await parseTodoFile(todoPath);

      if (tasks.length === 0) {
        return workflowFailure(
          'No tasks found in todo.md',
          [WorkflowError.userInput('Please run git plan first to generate tasks')]
        );
      }

      while (progress.executedTasks < maxTasks) {
        const nextTask = getNextTask(tasks);

        if (!nextTask) {
          break;
        }

        const taskResult = await this.executeTask(
          nextTask,
          input,
          config,
          progress
        );

        if (!taskResult.success) {
          return workflowFailure(
            `Task #${nextTask.index + 1} failed`,
            taskResult.errors || []
          );
        }

        progress.executedTasks++;
      }

      if (input.autoCommit) {
        await this.performAutoCommit(config);
      }

      return workflowSuccess(
        {
          executedTasks: progress.executedTasks,
          totalTasks: tasks.length,
          filesModified: progress.filesModified,
          patch: '',
          dryRunApplied: input.saveOnly || false,
          backupIds: progress.backupIds
        },
        `Completed ${progress.executedTasks}/${tasks.length} tasks`
      );
    } catch (error) {
      if (error instanceof AIError) {
        return workflowFailure(
          'LLM call failed during execution',
          [
            WorkflowError.externalService(
              'LLM service unavailable or returned error',
              error
            )
          ]
        );
      }

      return workflowFailure(
        'Unexpected error during auto execution',
        [
          WorkflowError.internalBug('Auto execution failed', error as Error)
        ]
      );
    }
  }

  private async executeTask(
    task: TaskStatus,
    input: AutoInput,
    config: WorkflowConfig,
    progress: AutoWorkflowProgress
  ): Promise<{ success: boolean; errors?: WorkflowError[] }> {
    let attempts = task.attempts || 0;
    let taskCompleted = false;
    const previousFeedback = attempts > 0 && task.reviewIssues
      ? task.reviewIssues.join('\n')
      : undefined;

    while (attempts <= MAX_RETRY_ATTEMPTS && !taskCompleted) {
      attempts++;

      const todoPath = process.cwd() + '/todo.md';
      await updateTaskStatus(todoPath, task.index, {
        execStatus: 'in_progress',
        attempts
      });

      const gathered = await this.contextGatherer.gather(task.description);
      const { code, success } = await this.generateCode(
        task,
        gathered.summary,
        config.model || 'Assistant',
        previousFeedback
      );

      if (!success) {
        await updateTaskStatus(todoPath, task.index, {
          execStatus: 'failed'
        });
        return {
          success: false,
          errors: [
            WorkflowError.externalService('Code generation failed')
          ]
        };
      }

      const savedPath = await saveRawOutput(code, task.index);

      const generated = parseGeneratedCode(code);

      if (generated.files.length > 0) {
        if (!input.saveOnly) {
          let backupId: string | undefined;
          try {
            const backup = await backupFiles(generated.files);
            backupId = backup.id;
            if (backupId) {
              progress.backupIds.push(backupId);
            }
          } catch (e: unknown) {
            // Continue without backup
          }

          const { written } = await writeGeneratedCode(generated);
          progress.filesModified.push(...written);
          await updateTaskStatus(todoPath, task.index, { backupId });
        }
      }

      if (!input.skipReview) {
        const reviewResult = await this.reviewCode(input.reviewLevel || 'standard', false);

        if (reviewResult.score >= (input.minScore || 70)) {
          taskCompleted = true;
          await updateTaskStatus(todoPath, task.index, {
            completed: true,
            execStatus: 'done'
          });
        } else {
          taskCompleted = false;
          await updateTaskStatus(todoPath, task.index, {
            reviewScore: reviewResult.score,
            reviewIssues: reviewResult.issues.map((i: any) => i.message)
          });

          if (attempts > MAX_RETRY_ATTEMPTS) {
            await updateTaskStatus(todoPath, task.index, { execStatus: 'failed' });
            return {
              success: false,
              errors: [
                WorkflowError.capabilityDenied(
                  `Max retry attempts reached. Final score: ${reviewResult.score} < ${input.minScore || 70}`,
                  ['Consider adjusting minScore', 'Review task requirements', 'Simplify the task']
                )
              ]
            };
          }
        }
      } else {
        taskCompleted = true;
        await updateTaskStatus(todoPath, task.index, {
          completed: true,
          execStatus: 'done'
        });
      }
    }

    return { success: taskCompleted };
  }

  private async generateCode(
    task: TaskStatus,
    context: string,
    model: string,
    previousFeedback?: string
  ): Promise<{ code: string; success: boolean; error?: string }> {
    try {
      const response = await runLLM({
        prompt: {
          system: `你是一个全方位的交付专家。
1. 如果当前任务涉及代码（如 .ts, .js, .py 等文件），请扮演**资深软件工程师**，确保代码健壮、注释详尽、遵循最佳实践，并追求极致的模块化与性能。
2. 如果当前任务涉及文档（如 .md, .yaml, .html 等文件），请扮演**资深内容专家或历史学者**，确保叙事优美、逻辑严密、事实准确。

**重要输出格式要求：**
- 每个文件必须以 \`### 文件: path\` 或 \`**文件**: path\` 明确标注。
- 代码内容必须包裹在对应的 Markdown 代码块中。
- 不要解释，直接输出文件内容。`,
          messages: [
            {
              role: 'user',
              content: `[项目上下文]\n${context}\n\n[当前任务]\n${task.description}\n\n${previousFeedback ? `[审查反馈 - 请修复以下问题]\n${previousFeedback}\n\n` : ''}请根据以上信息开始任务。`
            }
        ]
       },
       model: model || 'Assistant',
       stream: false
      });
      return { code: response.rawText, success: true };
    } catch (error: any) {
      return { code: '', success: false, error: error.message };
    }
  }

  private async reviewCode(
    level: 'quick' | 'standard' | 'deep' | undefined,
    staged: boolean
  ): Promise<any> {
    const levelMap: Record<string, ReviewLevel> = {
      'quick': ReviewLevel.QUICK,
      'standard': ReviewLevel.STANDARD,
      'deep': ReviewLevel.DEEP
    };
    const reviewLevel = level ? levelMap[level] : ReviewLevel.STANDARD;
    return await this.codeReviewer.review(reviewLevel, staged);
  }

  private async performAutoCommit(config: WorkflowConfig): Promise<string | undefined> {
    if (!(await this.gitService.isWorkingTreeClean())) {
      await this.gitService.stageAll();
      const router = await getRouter();
      const commitGen = new CommitMessageGenerator(this.gitService, router);
      const commit = await commitGen.generate({ detailed: false });
      await this.gitService.commit(commit.full);
      return commit.full;
    }
    return undefined;
  }
}
