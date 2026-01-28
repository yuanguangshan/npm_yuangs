import { SemanticDiffEngine } from '../../../../src/core/git/semantic/SemanticDiffEngine';
import { ChangeType, SemanticCategory } from '../../../../src/core/git/semantic/types';

describe('SemanticDiffEngine', () => {
    it('should detect added functions statically', () => {
        const diff = `diff --git a/test.ts b/test.ts
--- a/test.ts
+++ b/test.ts
+export function newFunction(a: number) {
+  return a + 1;
+}
+const arrowFunc = () => {};
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files).toHaveLength(1);
        expect(result.files[0].changes).toContainEqual(expect.objectContaining({
            name: 'newFunction',
            category: SemanticCategory.FUNCTION,
            type: ChangeType.ADDITION
        }));
    });

    it('should detect deleted classes and mark them as breaking', () => {
        const diff = `diff --git a/src/index.ts b/src/index.ts
--- a/src/index.ts
+++ b/src/index.ts
-export class OldService {
-  doSomething() {}
-}
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.isBreaking).toBe(true);
        expect(result.files[0].changes[0]).toMatchObject({
            name: 'OldService',
            category: SemanticCategory.CLASS,
            type: ChangeType.DELETION,
            isBreaking: true
        });
    });

    it('should skip comments in TS/JS files', () => {
        const diff = `diff --git a/comment.ts b/comment.ts
+++ b/comment.ts
+// function fakeFunction() {}
+/* class FakeClass {} */
+export function realFunction() {}
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files[0].changes).toHaveLength(1);
        expect(result.files[0].changes[0].name).toBe('realFunction');
    });

    it('should handle empty or invalid diffs gracefully', () => {
        expect(SemanticDiffEngine.analyze('').files).toHaveLength(0);
        expect(SemanticDiffEngine.analyze('invalid diff data').files).toHaveLength(0);
    });

    it('should handle file deletions (/dev/null)', () => {
        const diff = `diff --git a/old.ts b/dev/null
--- a/old.ts
+++ /dev/null
-export function deletedFunc() {}
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files[0].path).toBe('old.ts');
        expect(result.files[0].changes[0].type).toBe(ChangeType.DELETION);
    });
});
