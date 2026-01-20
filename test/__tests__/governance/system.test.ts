import { CodeChangeAction } from "../../../src/governance/actions/CodeChangeAction";
import { assertTransition, GovernanceStateMachine } from "../../../src/governance/fsm/stateMachine";
import { issue, verify, checkCapability } from "../../../src/governance/capability/token";

describe("Governance System", () => {
  describe("CodeChangeAction", () => {
    it("should create action with DRAFT state", () => {
      const payload = {
        files: ["test.ts"],
        diff: "@@ -0,0 +1,1 @@\n+hello world",
      };

      const action = CodeChangeAction.create(
        payload,
        "Test rationale",
        "agent-1",
        "plan-123"
      );

      expect(action.kind).toBe("code_change");
      expect(action.state).toBe("DRAFT");
      expect(action.id).toBeDefined();
      expect(action.rationale).toBe("Test rationale");
    });

    it("should transition from DRAFT to PROPOSED", () => {
      const action = createTestAction();
      action.propose();
      expect(action.state).toBe("PROPOSED");
    });

    it("should reject invalid state transitions", () => {
      const action = createTestAction();

      expect(() => action.approve("human")).toThrow();
      expect(() => action.execute({} as any)).toThrow();
    });

    it("should approve from PROPOSED to APPROVED", () => {
      const action = createTestAction();
      action.propose();
      action.approve("human");
      expect(action.state).toBe("APPROVED");
    });

    it("should reject non-human approval", () => {
      const action = createTestAction();
      action.propose();

      expect(() => action.approve("policy" as any)).toThrow(
        "Governance violation: only human can approve"
      );
    });
  });

  describe("State Machine Invariants", () => {
    it("should allow valid transition DRAFT -> PROPOSED", () => {
      expect(() => assertTransition("DRAFT", "PROPOSED")).not.toThrow();
    });

    it("should allow valid transition PROPOSED -> APPROVED", () => {
      expect(() => assertTransition("PROPOSED", "APPROVED")).not.toThrow();
    });

    it("should allow valid transition APPROVED -> EXECUTED", () => {
      expect(() => assertTransition("APPROVED", "EXECUTED")).not.toThrow();
    });

    it("should reject illegal transition DRAFT -> EXECUTED", () => {
      expect(() => assertTransition("DRAFT", "EXECUTED")).toThrow(
        "Governance violation: illegal state transition"
      );
    });

    it("should reject illegal transition EXECUTED -> APPROVED", () => {
      expect(() => assertTransition("EXECUTED", "APPROVED")).toThrow(
        "Governance violation: illegal state transition"
      );
    });

    it("should track transition history", () => {
      const fsm = new GovernanceStateMachine("DRAFT");

      fsm.transition("PROPOSED", "test reason");
      fsm.transition("APPROVED");

      const history = fsm.transitionHistory;

      expect(history.length).toBe(2);
      expect(history[0].from).toBe("DRAFT");
      expect(history[0].to).toBe("PROPOSED");
      expect(history[1].from).toBe("PROPOSED");
      expect(history[1].to).toBe("APPROVED");
    });
  });

  describe("Capability System", () => {
    it("should issue valid capability", () => {
      const cap = issue({
        subject: "agent-1",
        rights: [{ type: "APPLY_DIFF" }],
        scope: { type: "ACTION", id: "action-1" },
        ttlMs: 60000,
      });

      expect(cap.id).toBeDefined();
      expect(cap.signature).toBeDefined();
      expect(cap.issuedAt).toBeLessThanOrEqual(Date.now());
      expect(cap.maxUses).toBe(1);
    });

    it("should verify valid capability signature", () => {
      const cap = issue({
        subject: "agent-1",
        rights: [{ type: "APPLY_DIFF" }],
        scope: { type: "ACTION", id: "action-1" },
        ttlMs: 60000,
      });

      const isValid = verify(cap);
      expect(isValid).toBe(true);
    });

    it("should reject tampered capability", () => {
      const cap = issue({
        subject: "agent-1",
        rights: [{ type: "APPLY_DIFF" }],
        scope: { type: "ACTION", id: "action-1" },
        ttlMs: 60000,
      });

      cap.signature = "tampered";

      const isValid = verify(cap);
      expect(isValid).toBe(false);
    });

    it("should detect expired capabilities", () => {
      const cap = issue({
        subject: "agent-1",
        rights: [{ type: "APPLY_DIFF" }],
        scope: { type: "ACTION", id: "action-1" },
        ttlMs: -1000,
      });

      expect(() => {
        verify(cap);
        throw new Error("Invalid capability");
      }).toThrow();
    });

    it("should enforce scope restrictions", () => {
      const cap = issue({
        subject: "agent-1",
        rights: [{ type: "APPLY_DIFF" }],
        scope: { type: "ACTION", id: "action-1" },
        ttlMs: 60000,
      });

      expect(() => {
        checkCapability(cap, { type: "APPLY_DIFF" }, { actionId: "action-2" });
      }).toThrow("Scope violation");
    });
  });
});

function createTestAction(): CodeChangeAction {
  return CodeChangeAction.create(
    {
      files: ["test.ts"],
      diff: "@@ -0,0 +1,1 @@\n+hello",
    },
    "Test rationale",
    "agent-1",
    "plan-123"
  );
}
