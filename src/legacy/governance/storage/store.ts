import fs from "fs";
import path from "path";
import os from "os";

const DATA_DIR = path.join(os.homedir(), ".yuangs");
const STORE_PATH = path.join(DATA_DIR, "actions.json");

export interface SerializedAction {
  id: string;
  kind: string;
  state: string;
  payload: any;
  rationale: string;
  provenance: any;
  updatedAt: number;
  executedAt?: number;
}

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function atomicWrite(filePath: string, data: string): void {
  const tmpPath = `${filePath}.tmp.${Date.now()}`;

  try {
    fs.writeFileSync(tmpPath, data, "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    throw error;
  }
}

export function loadActions(): Record<string, SerializedAction> {
  ensureDataDir();

  if (!fs.existsSync(STORE_PATH)) {
    return {};
  }

  try {
    const content = fs.readFileSync(STORE_PATH, "utf-8");
    const data = JSON.parse(content);
    return deserializeActions(data);
  } catch (error) {
    console.error(`Failed to load actions: ${error}`);
    return {};
  }
}

export function saveActions(actions: Record<string, SerializedAction>): void {
  ensureDataDir();

  try {
    const content = JSON.stringify(actions, null, 2);
    atomicWrite(STORE_PATH, content);
  } catch (error) {
    console.error(`Failed to save actions: ${error}`);
    throw error;
  }
}

export function deserializeActions(
  data: Record<string, any>
): Record<string, SerializedAction> {
  const result: Record<string, SerializedAction> = {};

  for (const [id, raw] of Object.entries(data)) {
    try {
      result[id] = validateAction(raw);
    } catch (error) {
      console.warn(`Invalid action ${id}, skipping: ${error}`);
    }
  }

  return result;
}

function validateAction(raw: any): SerializedAction {
  if (typeof raw.id !== "string" || !raw.id) {
    throw new Error("Action missing valid id");
  }

  const validStates = [
    "DRAFT",
    "PROPOSED",
    "APPROVED",
    "EXECUTED",
    "OBSERVED",
    "VERIFIED",
    "REJECTED",
  ];

  if (!validStates.includes(raw.state)) {
    throw new Error(`Invalid state: ${raw.state}`);
  }

  if (typeof raw.rationale !== "string") {
    throw new Error("Rationale must be a string");
  }

  if (typeof raw.updatedAt !== "number") {
    throw new Error("UpdatedAt must be a number");
  }

  if (raw.state === "EXECUTED" && !raw.executedAt) {
    throw new Error("EXECUTED actions must have executedAt");
  }

  return raw as SerializedAction;
}

export function auditActions(actions: Record<string, SerializedAction>): void {
  for (const [id, action] of Object.entries(actions)) {
    try {
      validateAction(action);
    } catch (error) {
      throw new Error(`Audit failed for action ${id}: ${error}`);
    }
  }
}
