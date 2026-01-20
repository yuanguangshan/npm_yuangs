---------------------------- MODULE CodeChangeGovernance --------------------
EXTENDS Naturals

CONSTANTS
  ACTIONS = {a1, a2}
  STATES = {DRAFT, PROPOSED, APPROVED, EXECUTED, OBSERVED, VERIFIED, REJECTED}

VARIABLES
  actionState \in [ACTIONS -> STATES]
  worldState
  snapshot
  caps

----------------------------------------------------------------------------
TYPE DEFINITION
----------------------------------------------------------------------------

ValidState == STATES

LegalTransition(from, to) ==
  /\ (from = DRAFT /\ to = PROPOSED)
  \/ (from = PROPOSED /\ (to = APPROVED \/ to = REJECTED))
  \/ (from = APPROVED /\ to = EXECUTED)
  \/ (from = EXECUTED /\ to = OBSERVED)
  \/ (from = OBSERVED /\ to = VERIFIED)

----------------------------------------------------------------------------
INITIAL STATE
----------------------------------------------------------------------------

Init ==
  /\ actionState = [a \in ACTIONS |-> DRAFT]
  /\ worldState = Empty
  /\ snapshot = 0
  /\ caps = Empty

----------------------------------------------------------------------------
INVARIANTS
----------------------------------------------------------------------------

StateInvariant ==
  /\A a \in ACTIONS : ValidState(actionState[a])

ApprovalInvariant ==
  /\A a \in ACTIONS :
      actionState[a] = APPROVED =>
        \/ \E t \in TIMES :
            /\ actionState[a] # t = PROPOSED
            /\ HumanApproved(t, a)

ExecutionInvariant ==
  /\A a \in ACTIONS :
      actionState[a] = EXECUTED =>
        \/ \E t \in TIMES :
            /\ actionState[a] # t = APPROVED
            /\ SnapshotCreated(t)
            /\ SnapshotValid(t)

NoExtraChangesInvariant ==
  /\A a \in ACTIONS :
      actionState[a] = EXECUTED =>
        WorldChanges \subseteq DeclaredChanges(a)

RevocableInvariant ==
  /\A a \in ACTIONS :
      actionState[a] = REJECTED =>
        /\A t' > t :
            actionState[a] # t' = REJECTED

CapabilityInvariant ==
  /\A a \in ACTIONS :
      actionState[a] = EXECUTED =>
        \/ \E c \in caps :
            CapabilityValid(c) /\
            CapabilitySubject(c) = a /\
            CapabilityGrantExecute(c, a)

----------------------------------------------------------------------------
TRANSITION ACTIONS
----------------------------------------------------------------------------

Propose(a) ==
  /\ actionState[a] = DRAFT
  /\ actionState' = [actionState EXCEPT ![a -> PROPOSED]]

Approve(a) ==
  /\ actionState[a] = PROPOSED
  /\ HumanApprovalPresent(a)
  /\ actionState' = [actionState EXCEPT ![a -> APPROVED]]

Reject(a) ==
  /\ actionState[a] \in {PROPOSED, APPROVED, EXECUTED, OBSERVED}
  /\ actionState' = [actionState EXCEPT ![a -> REJECTED]]

Execute(a, s) ==
  /\ actionState[a] = APPROVED
  /\ SnapshotExists(s)
  /\ snapshot = s
  /\ worldState' = ApplyDiff(worldState, a)
  /\ actionState' = [actionState EXCEPT ![a -> EXECUTED]]

Observe(a) ==
  /\ actionState[a] = EXECUTED
  /\ WorldChanges = GetGitDiff(worldState')
  /\ actionState' = [actionState EXCEPT ![a -> OBSERVED]]

Verify(a) ==
  /\ actionState[a] = OBSERVED
  /\ VerifyNoExtraChanges(a, worldState')
  /\ actionState' = [actionState EXCEPT ![a -> OBSERVED]]

Rollback(a, s) ==
  /\ actionState[a] = EXECUTED
  /\ SnapshotExists(s)
  /\ worldState' = s
  /\ actionState' = [actionState EXCEPT ![a -> REJECTED]]

IssueCap(c, agent, rights, scope) ==
  /\ c \notin caps
  /\ caps' = caps \cup {c}
  /\ CapabilitySignatureValid(c)

RevokeCap(c) ==
  /\ c \in caps
  /\ caps' = caps \ {c}

----------------------------------------------------------------------------
NEXT STATE RELATION
----------------------------------------------------------------------------

Next ==
  \/ \E a \in ACTIONS : Propose(a)
  \/ \E a \in ACTIONS : Approve(a)
  \/ \E a \in ACTIONS : Reject(a)
  \/ \E a \in ACTIONS, s \in Snapshot : Execute(a, s)
  \/ \E a \in ACTIONS : Observe(a)
  \/ \E a \in ACTIONS : Verify(a)
  \/ \E a \in ACTIONS, s \in Snapshot : Rollback(a, s)
  \/ \E c \in Cap, agent \in Agent, rights \in Rights, scope \in Scope : IssueCap(c, agent, rights, scope)
  \/ \E c \in Cap : RevokeCap(c)

----------------------------------------------------------------------------
THEOREMS
----------------------------------------------------------------------------

THEOREM NoSkippedStates ==
  ASSUMING Init /\ [][Next]_actionState
  PROVE  \A a \in ACTIONS :
              actionState[a] = EXECUTED =>
                \/ \E t1, t2, t3 \in TIMES :
                    actionState[a] # t1 = PROPOSED /\
                    actionState[a] # t2 = APPROVED /\
                    actionState[a] # t3 = EXECUTED

THEOREM NoUnauthorizedExecution ==
  ASSUMING Init /\ [][Next]_actionState
  PROVE  \A a \in ACTIONS :
              actionState[a] = EXECUTED =>
                HumanApprovedBeforeExecution(a)

THEOREM RollbackSafety ==
  ASSUMING Init /\ Execute(a, s) /\ Rollback(a, s)
  PROVE  worldState = s

THEOREM CapabilityEnforcement ==
  ASSUMING Init /\ [][Next]_caps
  PROVE  \A a \in ACTIONS, c \in caps :
              (c \in caps /\ CapabilitySubject(c) = a /\ CapabilityGrantExecute(c, a)) =>
                actionState[a] = EXECUTED

=============================================================================
