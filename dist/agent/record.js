"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveRecord = saveRecord;
exports.getRecords = getRecords;
exports.getRecordById = getRecordById;
const records = [];
function saveRecord(record) {
    records.push(record);
    // Keep only last 100 records in memory
    if (records.length > 100) {
        records.shift();
    }
}
function getRecords() {
    return [...records];
}
function getRecordById(id) {
    return records.find(r => r.id === id);
}
//# sourceMappingURL=record.js.map