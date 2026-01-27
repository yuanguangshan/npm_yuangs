import crypto from "crypto";
import { execSync } from "child_process";

/**
 * 安全警告：必须通过环境变量 CAP_SECRET 提供密钥
 * 如果未提供，将抛出错误而不是使用默认值
 */
const SECRET = (() => {
  const secret = process.env.CAP_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "Security: CAP_SECRET environment variable is required and must be at least 32 characters"
    );
  }
  return secret;
})();

export type Right =
  | { type: "APPLY_DIFF" }
  | { type: "READ_FILE"; path: string }
  | { type: "EXECUTE_ACTION"; actionId: string };

export type Scope =
  | { type: "ACTION"; id: string }
  | { type: "PATH_PREFIX"; prefix: string }
  | { type: "REPO" };

export interface Capability {
  id: string;
  subject: string;
  rights: Right[];
  scope: Scope;
  issuedAt: number;
  expiresAt: number;
  maxUses: number;
  used: number;
  signature: string;
}

export function sign(data: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex");
}

export function verify(cap: Capability): boolean {
  const { signature, ...rest } = cap;
  const payload = JSON.stringify(rest);
  const computed = sign(payload);

  return computed === signature;
}

export function issue(input: {
  subject: string;
  rights: Right[];
  scope: Scope;
  ttlMs: number;
  maxUses?: number;
}): Capability {
  const base = {
    id: crypto.randomUUID(),
    subject: input.subject,
    rights: input.rights,
    scope: input.scope,
    issuedAt: Date.now(),
    expiresAt: Date.now() + input.ttlMs,
    maxUses: input.maxUses ?? 1,
    used: 0,
  };

  const payload = JSON.stringify(base);

  return {
    ...base,
    signature: sign(payload),
  };
}

export function checkCapability(
  cap: Capability,
  want: Right,
  context: { actionId?: string; path?: string }
): void {
  if (!verify(cap)) {
    throw new Error("Invalid capability: signature verification failed");
  }

  if (Date.now() > cap.expiresAt) {
    throw new Error("Capability expired");
  }

  if (cap.used >= cap.maxUses) {
    throw new Error("Capability exhausted (max uses reached)");
  }

  const rightMatch = cap.rights.some(
    (r) => JSON.stringify(r) === JSON.stringify(want)
  );

  if (!rightMatch) {
    throw new Error(
      `Capability does not grant right: ${JSON.stringify(want)}`
    );
  }

  if (cap.scope.type === "ACTION" && context.actionId !== cap.scope.id) {
    throw new Error(
      `Scope violation: capability scoped to action ${cap.scope.id}, used on ${context.actionId}`
    );
  }

  if (
    cap.scope.type === "PATH_PREFIX" &&
    context.path &&
    !context.path.startsWith(cap.scope.prefix)
  ) {
    throw new Error(
      `Scope violation: capability scoped to ${cap.scope.prefix}, used on ${context.path}`
    );
  }

  cap.used++;
}

export function attenuate(
  cap: Capability,
  limits: Partial<Pick<Capability, "expiresAt" | "maxUses">>
): Capability {
  if (!verify(cap)) {
    throw new Error("Cannot attenuate invalid capability");
  }

  const reduced = {
    ...cap,
    expiresAt: Math.min(
      cap.expiresAt,
      limits.expiresAt ?? cap.expiresAt
    ),
    maxUses: Math.min(cap.maxUses, limits.maxUses ?? cap.maxUses),
    used: 0,
    signature: "",
  };

  const payload = JSON.stringify({
    id: reduced.id,
    subject: reduced.subject,
    rights: reduced.rights,
    scope: reduced.scope,
    issuedAt: reduced.issuedAt,
    expiresAt: reduced.expiresAt,
    maxUses: reduced.maxUses,
    used: 0,
  });

  return {
    ...reduced,
    signature: sign(payload),
  };
}

const revokedCaps = new Set<string>();

export function revoke(capId: string): void {
  revokedCaps.add(capId);
}

export function checkRevoked(cap: Capability): void {
  if (revokedCaps.has(cap.id)) {
    throw new Error(`Capability ${cap.id} has been revoked`);
  }
}
