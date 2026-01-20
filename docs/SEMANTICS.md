# diff-edit Execution Semantics v1

## 1. Action Lifecycle

```
PROPOSED → APPROVED → EXECUTED | REJECTED
```

## 2. Truth Sources

- **Patch Truth**: Declared intent (diff)
- **Snapshot Truth**: Observed working tree changes
- **Git Truth**: Immutable historical record

These sources MUST NOT be mixed.

---

## 3. Execution Phases

### 3.1 Pre-Execution (Validation)

- Applies patch to sandbox
- Verifies no unexpected changes
- Does NOT create commits

Failure → rollback → REJECTED

---

### 3.2 Execution (Commit)

- Creates exactly one Git commit
- No validation or inspection

Failure → rollback → REJECTED

---

### 3.3 Post-Execution (Reporting)

- Reads commit metadata
- Produces audit output
- Does not inspect working tree

---

## 4. Guarantees

If an action reaches EXECUTED:

- Patch intent was honored
- Snapshot validation passed
- Git history reflects the change
- Execution is auditable and replayable
