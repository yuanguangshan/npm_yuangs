"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordNode = recordNode;
exports.recordEdge = recordEdge;
exports.getNode = getNode;
exports.getEdges = getEdges;
exports.getObservationNode = getObservationNode;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const KG_DIR = path_1.default.join(os_1.default.homedir(), '.yuangs', 'knowledge');
const NODE_FILE = path_1.default.join(KG_DIR, 'nodes.jsonl');
const EDGE_FILE = path_1.default.join(KG_DIR, 'edges.jsonl');
function ensureDir() {
    if (!fs_1.default.existsSync(KG_DIR)) {
        fs_1.default.mkdirSync(KG_DIR, { recursive: true });
    }
}
function recordNode(node) {
    ensureDir();
    const record = {
        ...node,
        timestamp: node.timestamp || Date.now()
    };
    fs_1.default.appendFileSync(NODE_FILE, JSON.stringify(record) + '\n');
}
function recordEdge(edge) {
    ensureDir();
    const record = {
        ...edge,
        timestamp: Date.now()
    };
    fs_1.default.appendFileSync(EDGE_FILE, JSON.stringify(record) + '\n');
}
function getNode(id) {
    if (!fs_1.default.existsSync(NODE_FILE))
        return null;
    const lines = fs_1.default.readFileSync(NODE_FILE, 'utf8').split('\n');
    for (const line of lines.reverse()) {
        if (!line.trim())
            continue;
        const node = JSON.parse(line);
        if (node.id === id)
            return node;
    }
    return null;
}
function getEdges(from, to, type) {
    if (!fs_1.default.existsSync(EDGE_FILE))
        return [];
    const lines = fs_1.default.readFileSync(EDGE_FILE, 'utf8').split('\n');
    const result = [];
    for (const line of lines.reverse()) {
        if (!line.trim())
            continue;
        const edge = JSON.parse(line);
        let match = true;
        if (from && edge.from !== from)
            match = false;
        if (to && edge.to !== to)
            match = false;
        if (type && edge.type !== type)
            match = false;
        if (match) {
            result.push(edge);
        }
    }
    return result;
}
function getObservationNode(id) {
    return getNode(id);
}
//# sourceMappingURL=index.js.map