import { GitService } from '../git/GitService';
import { CodeReviewer, ReviewLevel, IssueSeverity } from '../git/CodeReviewer';
import { SecurityScanner } from '../security/SecurityScanner';
import { getRouter } from '../modelRouter';
import {
  ReviewInput,
  ReviewOutput,
  WorkflowConfig,
  WorkflowResult,
  WorkflowError,
  workflowSuccess,
  workflowFailure
} from './types';
import { ReviewIssue as WorkflowReviewIssue } from './types';

export class ReviewWorkflow {
  constructor(
    private gitService: GitService,
    private codeReviewer: CodeReviewer,
    private securityScanner: SecurityScanner
  ) {}

  async run(input: ReviewInput, config: WorkflowConfig): Promise<WorkflowResult<ReviewOutput>> {
    try {
      let reviewResult;

      if (input.reviewTarget === 'commit') {
        if (!input.targetRef) {
          return workflowFailure(
            'Commit reference required for commit review',
            [
              WorkflowError.userInput(
                'Please provide commit hash or reference (e.g., HEAD~1)',
                ['Use full commit hash', 'Or use references like HEAD~1, HEAD~2']
              )
            ]
          );
        }

        reviewResult = await this.reviewCommit(input.targetRef, input.level, config);
      } else if (input.reviewTarget === 'file') {
        if (!input.targetRef) {
          return workflowFailure(
            'File path required for file review',
            [WorkflowError.userInput('Please provide file path to review')]
          );
        }

        reviewResult = await this.reviewFile(input.targetRef, input.level, config);
      } else {
        const unstaged = input.reviewTarget === 'unstaged';
        reviewResult = await this.reviewWorkingTree(unstaged, input.level, config);
      }

      return workflowSuccess(reviewResult, 'Review completed successfully');
    } catch (error: any) {
      if (error.message && error.message.includes('No changes found')) {
        return workflowFailure(
          'No code changes to review',
          [WorkflowError.precondition('No staged or unstaged changes found')]
        );
      }

      return workflowFailure(
        'Unexpected error during review',
        [
          WorkflowError.internalBug('Review failed', error)
        ]
      );
    }
  }

  private async reviewCommit(
    commitRef: string,
    level: 'quick' | 'standard' | 'deep',
    config: WorkflowConfig
  ): Promise<ReviewOutput> {
    const commitInfo = await this.gitService.getCommitInfo(commitRef);

    if (!commitInfo) {
      throw WorkflowError.userInput(
        `Commit not found: ${commitRef}`,
        ['Use full commit hash', 'Or use references like HEAD~1, HEAD~2']
      );
    }

    const levelMap: Record<string, ReviewLevel> = {
      'quick': ReviewLevel.QUICK,
      'standard': ReviewLevel.STANDARD,
      'deep': ReviewLevel.DEEP
    };

    const result = await this.codeReviewer.reviewCommit(commitRef, levelMap[level]);

    return this.mapToReviewOutput(result);
  }

  private async reviewFile(
    filePath: string,
    level: 'quick' | 'standard' | 'deep',
    config: WorkflowConfig
  ): Promise<ReviewOutput> {
    const levelMap: Record<string, ReviewLevel> = {
      'quick': ReviewLevel.QUICK,
      'standard': ReviewLevel.STANDARD,
      'deep': ReviewLevel.DEEP
    };

    const result = await this.codeReviewer.reviewFile(filePath, levelMap[level]);
    return this.mapToReviewOutput(result);
  }

  private async reviewWorkingTree(
    unstaged: boolean,
    level: 'quick' | 'standard' | 'deep',
    config: WorkflowConfig
  ): Promise<ReviewOutput> {
    const levelMap: Record<string, ReviewLevel> = {
      'quick': ReviewLevel.QUICK,
      'standard': ReviewLevel.STANDARD,
      'deep': ReviewLevel.DEEP
    };

    const result = await this.codeReviewer.review(levelMap[level], !unstaged);
    return this.mapToReviewOutput(result);
  }

  private mapToReviewOutput(result: any): ReviewOutput {
    return {
      score: result.score || 0,
      confidence: result.confidence || 0,
      summary: result.summary || 'No summary provided',
      filesReviewed: result.filesReviewed || 0,
      issues: this.mapIssues(result.issues || []),
      strengths: result.strengths || [],
      recommendations: result.recommendations || []
    };
  }

  private mapIssues(issues: any[]): WorkflowReviewIssue[] {
    return issues.map((issue: any) => ({
      severity: this.mapSeverity(issue.severity),
      file: issue.file || 'unknown',
      line: issue.line,
      message: issue.message || 'No message',
      suggestion: issue.suggestion,
      snippet: issue.snippet
    }));
  }

  private mapSeverity(severity: any): 'info' | 'warning' | 'error' | 'critical' {
    if (!severity) return 'info';

    const severityMap: Record<string, 'info' | 'warning' | 'error' | 'critical'> = {
      [IssueSeverity.INFO]: 'info',
      [IssueSeverity.WARNING]: 'warning',
      [IssueSeverity.ERROR]: 'error',
      [IssueSeverity.CRITICAL]: 'critical'
    };

    return severityMap[severity] || 'info';
  }
}
