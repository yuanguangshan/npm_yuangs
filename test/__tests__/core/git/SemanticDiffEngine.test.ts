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

    it('should handle multi-file diffs correctly', () => {
        const diff = `diff --git a/file1.ts b/file1.ts
--- a/file1.ts
+++ b/file1.ts
+export function funcInFile1() {}

diff --git a/file2.ts b/file2.ts
--- a/file2.ts
+++ b/file2.ts
+export class ClassInFile2 {}
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files).toHaveLength(2);
        expect(result.files[0].changes[0].name).toBe('funcInFile1');
        expect(result.files[1].changes[0].name).toBe('ClassInFile2');
    });

    it('should handle non-TS/JS files without errors', () => {
        const diff = `diff --git a/README.md b/README.md
--- a/README.md
+++ b/README.md
+# Title
+New content
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files).toHaveLength(1);
        expect(result.files[0].changes).toHaveLength(0); // No semantic changes for non-TS/JS files
    });

    it('should detect interface additions', () => {
        const diff = `diff --git a/types.ts b/types.ts
--- a/types.ts
+++ b/types.ts
+export interface NewInterface {
+  prop: string;
+}
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files[0].changes).toContainEqual(expect.objectContaining({
            name: 'NewInterface',
            category: SemanticCategory.INTERFACE,
            type: ChangeType.ADDITION
        }));
    });

    it('should handle rename operations', () => {
        const diff = `diff --git a/oldName.ts b/newName.ts
--- a/oldName.ts
+++ b/newName.ts
+export function renamedFileFunc() {}
`;
        const result = SemanticDiffEngine.analyze(diff);
        expect(result.files[0].path).toBe('newName.ts'); // Target path should be used
    });

    it('should handle complex declarations without misinterpretation', () => {
        const diff = `diff --git a/complex.ts b/complex.ts
--- a/complex.ts
+++ b/complex.ts
+const obj = {
+  function: 'not a function',
+  class: 'not a class',
+};
+
+export const complexArrowFunc = (params: { callback: () => void; data: string; }) => {
+  // Implementation here
+};
`;
        const result = SemanticDiffEngine.analyze(diff);
        // Should detect complexArrowFunc as a function
        const detectedNames = result.files[0].changes.map(change => change.name);
        expect(detectedNames).toContain('complexArrowFunc');
    });
});
