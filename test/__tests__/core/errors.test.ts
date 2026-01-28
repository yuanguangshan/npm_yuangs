import { YuangsError, GitError, PlanError } from '../../../src/core/errors';

describe('YuangsError Hierarchy', () => {
    test('YuangsError should have correct properties', () => {
        const suggestions = ['Try checking your internet', 'Restart the app'];
        const error = new YuangsError('Something went wrong', 'TEST_CODE', suggestions);

        expect(error.message).toBe('Something went wrong');
        expect(error.code).toBe('TEST_CODE');
        expect(error.suggestions).toEqual(suggestions);
        expect(error.name).toBe('YuangsError');
    });

    test('GitError should have direct code GIT_ERROR', () => {
        const error = new GitError('Git failed');
        expect(error.code).toBe('GIT_ERROR');
        expect(error instanceof YuangsError).toBe(true);
        expect(error instanceof GitError).toBe(true);
    });

    test('PlanError should have direct code PLAN_ERROR', () => {
        const error = new PlanError('Plan failed');
        expect(error.code).toBe('PLAN_ERROR');
        expect(error instanceof YuangsError).toBe(true);
        expect(error instanceof PlanError).toBe(true);
    });
});
