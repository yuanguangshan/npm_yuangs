import fs from 'fs';
import path from 'path';
import os from 'os';
import { KGNode, KGEdge, KGEdgeType } from './types';

const KG_DIR = path.join(os.homedir(), '.yuangs', 'knowledge');
const NODE_FILE = path.join(KG_DIR, 'nodes.jsonl');
const EDGE_FILE = path.join(KG_DIR, 'edges.jsonl');

function ensureDir() {
  if (!fs.existsSync(KG_DIR)) {
    fs.mkdirSync(KG_DIR, { recursive: true });
  }
}

export function recordNode<T = any>(node: KGNode<T>) {
  ensureDir();
  const record = {
    ...node,
    timestamp: node.timestamp || Date.now()
  };
  fs.appendFileSync(NODE_FILE, JSON.stringify(record) + '\n');
}

export function recordEdge(edge: {
  from: string;
  to: string;
  type: KGEdgeType;
  metadata?: any;
}) {
  ensureDir();
  const record = {
    ...edge,
    timestamp: Date.now()
  };
  fs.appendFileSync(EDGE_FILE, JSON.stringify(record) + '\n');
}

export function getNode<T = any>(id: string): KGNode<T> | null {
  if (!fs.existsSync(NODE_FILE)) return null;

  const lines = fs.readFileSync(NODE_FILE, 'utf8').split('\n');
  for (const line of lines.reverse()) {
    if (!line.trim()) continue;
    const node = JSON.parse(line);
    if (node.id === id) return node;
  }
  return null;
}

export function getEdges(from?: string, to?: string, type?: KGEdgeType): KGEdge[] {
  if (!fs.existsSync(EDGE_FILE)) return [];

  const lines = fs.readFileSync(EDGE_FILE, 'utf8').split('\n');
  const result: KGEdge[] = [];

  for (const line of lines.reverse()) {
    if (!line.trim()) continue;
    const edge = JSON.parse(line);

    let match = true;
    if (from && edge.from !== from) match = false;
    if (to && edge.to !== to) match = false;
    if (type && edge.type !== type) match = false;

    if (match) {
      result.push(edge);
    }
  }

  return result;
}

export function getObservationNode(id: string): KGNode | null {
  return getNode(id);
}
