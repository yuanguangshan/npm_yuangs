---------------------------- MODULE CodeChangeGovernanceV2 ----------------------------
EXTENDS Naturals, FiniteSets, Sequences

(******************************************************************************)
(* 代码变更治理 V2 — TLA+ 形式化规约                                           *)
(*                                                                            *)
(* 治理流程状态机：                                                            *)
(*   DRAFT → PROPOSED → APPROVED → EXECUTED → OBSERVED → VERIFIED            *)
(*                    ↘ REJECTED ←────── (任意阶段)                           *)
(*                                                                            *)
(* 安全性质：                                                                  *)
(*   1. ExecutionRequiresApproval — 执行前必须经过审批                         *)
(*   2. CapabilityRequired — 执行时必须持有能力令牌                             *)
(*   3. NoExtraChanges — 验证通过意味着实际变更 = 声明变更                      *)
(*   4. NoExecuteAfterRevocation — 撤销令牌后不得执行                           *)
(*   5. NoDoubleExecute — 同一动作不得重复执行                                 *)
(******************************************************************************)

CONSTANTS Actions, Agents, Rights, CapabilityTokens,
            CapabilitySubject, CapabilityGrant, GetActualChanges
ASSUME Cardinality(Actions) > 0
ASSUME Agents /= {}
ASSUME Rights /= {}
ASSUME CapabilityTokens /= {}

States == {"DRAFT", "PROPOSED", "APPROVED", "EXECUTED", "OBSERVED", "VERIFIED", "REJECTED"}

(******************************************************************************)
(* 状态变量                                                                    *)
(******************************************************************************)
VARIABLES actionState,      \* 每个动作的当前状态
          worldState,       \* 抽象世界状态
          snapshots,        \* 快照集
          caps,             \* 已签发的能力令牌
          revokedCaps,      \* 已撤销的能力令牌
          approvedBy,       \* 审批者
          observations,     \* 观察记录
          declaredChanges,  \* 声明变更
          execHistory       \* 执行历史（防止重复执行）

None == "None"

(******************************************************************************)
(* 类型不变量                                                                  *)
(******************************************************************************)

TypeOk ==
  /\ actionState \in [Actions -> States]
  /\ worldState \in Seq(STRING)
  /\ snapshots \in [STRING -> Seq(STRING)]
  /\ caps \subseteq CapabilityTokens
  /\ revokedCaps \subseteq CapabilityTokens
  /\ (caps \cap revokedCaps) = {}            \* 令牌不能同时有效和已撤销
  /\ approvedBy \in [Actions -> Agents \cup {None}]
  /\ observations \in [Actions -> STRING]
  /\ declaredChanges \in [Actions -> STRING]
  /\ execHistory \subseteq Actions

(******************************************************************************)
(* 初始化                                                                      *)
(******************************************************************************)

Init ==
  /\ actionState = [a \in Actions |-> "DRAFT"]
  /\ worldState = << >>
  /\ snapshots = [s \in {} |-> << >>]
  /\ caps = {}
  /\ revokedCaps = {}
  /\ approvedBy = [a \in Actions |-> None]
  /\ observations = [a \in Actions |-> ""]
  /\ declaredChanges = [a \in Actions |-> ""]
  /\ execHistory = {}

(******************************************************************************)
(* 状态转换动作                                                                *)
(******************************************************************************)

Propose(a) ==
  /\ actionState[a] = "DRAFT"
  /\ actionState' = [actionState EXCEPT ![a] = "PROPOSED"]
  /\ UNCHANGED <<worldState, snapshots, caps, revokedCaps, approvedBy,
                observations, declaredChanges, execHistory>>

Approve(a, agent) ==
  /\ actionState[a] = "PROPOSED"
  /\ agent \in Agents
  /\ approvedBy' = [approvedBy EXCEPT ![a] = agent]
  /\ actionState' = [actionState EXCEPT ![a] = "APPROVED"]
  /\ UNCHANGED <<worldState, snapshots, caps, revokedCaps, observations,
                declaredChanges, execHistory>>

Reject(a) ==
  /\ actionState[a] \in {"PROPOSED", "APPROVED"}
  /\ actionState' = [actionState EXCEPT ![a] = "REJECTED"]
  /\ UNCHANGED <<worldState, snapshots, caps, revokedCaps, approvedBy,
                observations, declaredChanges, execHistory>>

Execute(a, snapshotId) ==
  /\ actionState[a] = "APPROVED"
  /\ \E c \in (caps \ revokedCaps) :
       /\ CapabilitySubject(c) = a
       /\ CapabilityGrant(c, "execute") = TRUE
  /\ snapshotId \in DOMAIN snapshots
  /\ worldState' = Append(worldState, declaredChanges[a])
  /\ snapshots' = [snapshots EXCEPT ![snapshotId \o "_post"] = Append(snapshots[snapshotId], declaredChanges[a])]
  /\ actionState' = [actionState EXCEPT ![a] = "EXECUTED"]
  /\ execHistory' = execHistory \cup {a}
  /\ UNCHANGED <<caps, revokedCaps, approvedBy, observations, declaredChanges>>

Observe(a) ==
  /\ actionState[a] = "EXECUTED"
  /\ observations' = [observations EXCEPT ![a] = GetActualChanges(a, worldState)]
  /\ actionState' = [actionState EXCEPT ![a] = "OBSERVED"]
  /\ UNCHANGED <<worldState, snapshots, caps, revokedCaps, approvedBy,
                declaredChanges, execHistory>>

Verify(a) ==
  /\ actionState[a] = "OBSERVED"
  /\ observations[a] = declaredChanges[a]
  /\ actionState' = [actionState EXCEPT ![a] = "VERIFIED"]
  /\ UNCHANGED <<worldState, snapshots, caps, revokedCaps, approvedBy,
                observations, declaredChanges, execHistory>>

VerifyFail(a) ==
  /\ actionState[a] = "OBSERVED"
  /\ observations[a] # declaredChanges[a]
  /\ actionState' = [actionState EXCEPT ![a] = "REJECTED"]
  /\ UNCHANGED <<worldState, snapshots, caps, revokedCaps, approvedBy,
                observations, declaredChanges, execHistory>>

Rollback(a, snapshotId) ==
  /\ actionState[a] \in {"EXECUTED", "OBSERVED"}
  /\ snapshotId \in DOMAIN snapshots
  /\ worldState' = snapshots[snapshotId]
  /\ actionState' = [actionState EXCEPT ![a] = "REJECTED"]
  /\ UNCHANGED <<caps, revokedCaps, approvedBy, observations, declaredChanges,
                execHistory>>

IssueCap(cap, agent, right, scope) ==
  /\ cap \in CapabilityTokens
  /\ cap \notin caps
  /\ cap \notin revokedCaps
  /\ caps' = caps \cup {cap}
  /\ UNCHANGED <<actionState, worldState, snapshots, revokedCaps, approvedBy,
                observations, declaredChanges, execHistory>>

RevokeCap(cap) ==
  /\ cap \in caps
  /\ cap \notin revokedCaps
  /\ revokedCaps' = revokedCaps \cup {cap}
  /\ UNCHANGED <<actionState, worldState, snapshots, caps, approvedBy,
                observations, declaredChanges, execHistory>>

(******************************************************************************)
(* 下一步关系                                                                  *)
(******************************************************************************)

Next ==
  \/ \E a \in Actions : Propose(a)
  \/ \E a \in Actions, agent \in Agents : Approve(a, agent)
  \/ \E a \in Actions : Reject(a)
  \/ \E a \in Actions, sid \in STRING : Execute(a, sid)
  \/ \E a \in Actions : Observe(a)
  \/ \E a \in Actions : Verify(a)
  \/ \E a \in Actions : VerifyFail(a)
  \/ \E a \in Actions, sid \in STRING : Rollback(a, sid)
  \/ \E cap \in CapabilityTokens, agent \in Agents, r \in Rights, s \in STRING :
       IssueCap(cap, agent, r, s)
  \/ \E cap \in CapabilityTokens : RevokeCap(cap)

Vars == <<actionState, worldState, snapshots, caps, revokedCaps,
          approvedBy, observations, declaredChanges, execHistory>>

Spec == Init /\ [][Next]_Vars

(******************************************************************************)
(* 安全性质                                                                  *)
(******************************************************************************)

\* P1: 执行前必须经过审批
ExecutionRequiresApproval ==
  \A a \in Actions : actionState[a] = "EXECUTED" => approvedBy[a] # None

\* P2: 执行时必须持有有效能力令牌
CapabilityRequired ==
  \A a \in Actions : actionState[a] = "EXECUTED" =>
    \E c \in (caps \ revokedCaps) : CapabilitySubject(c) = a

\* P3: 验证通过意味着实际变更等于声明变更
NoExtraChanges ==
  \A a \in Actions : actionState[a] = "VERIFIED" => observations[a] = declaredChanges[a]

\* P4: 令牌撤销后不得执行
NoExecuteAfterRevocation ==
  \A a \in Actions : actionState[a] = "EXECUTED" =>
    \A c \in revokedCaps : CapabilitySubject(c) # a

\* P5: 同一动作不得重复执行
NoDoubleExecute ==
  \A a, b \in Actions :
    (actionState[a] \in {"EXECUTED", "OBSERVED", "VERIFIED"} /\
     actionState[b] \in {"EXECUTED", "OBSERVED", "VERIFIED"})
    => a = b

(******************************************************************************)
(* Mock 实现（供 .cfg 文件 <- 绑定使用）                                        *)
(******************************************************************************)

MockCapabilitySubject(c) == "act1"
MockCapabilityGrant(c, r) == TRUE
MockGetActualChanges(a, ws) == declaredChanges[a]

=============================================================================
