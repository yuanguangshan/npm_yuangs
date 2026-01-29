// @ts-nocheck
import {
  extractSymbols,
  generateFileSummary,
  generateMultipleFileSummaries,
  generateSummaryReport
} from '../../../src/agent/codeSummary';

describe('codeSummary', () => {
  describe('extractSymbols - TypeScript/JavaScript', () => {
    it('should extract imports correctly', () => {
      const code = `
import { useState } from 'react';
import axios from 'axios';
import type { User } from './types';
      `.trim();

      const symbols = extractSymbols(code, 'test.ts');
      expect(symbols.filter(s => s.type === 'import')).toHaveLength(3);
      expect(symbols.find(s => s.name === 'react')?.type).toBe('import');
    });

    it('should extract classes correctly', () => {
      const code = `
class UserService {
  constructor() {}
  getUser() {}
}
      `.trim();

      const symbols = extractSymbols(code, 'test.ts');
      const classes = symbols.filter(s => s.type === 'class');
      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('UserService');
    });

    it('should extract functions correctly', () => {
      const code = `
function calculateSum(a: number, b: number) {
  return a + b;
}

const asyncFunction = async () => {
  await fetchData();
};
      `.trim();

      const symbols = extractSymbols(code, 'test.ts');
      const functions = symbols.filter(s => s.type === 'function');
      expect(functions.length).toBeGreaterThanOrEqual(2);
      expect(functions.find(f => f.name === 'calculateSum')).toBeDefined();
    });

    it('should extract exports correctly', () => {
      const code = `
export function helper() {}
export class Service {}
export const API_URL = 'http://api.com';
      `.trim();

      const symbols = extractSymbols(code, 'test.ts');
      const exports = symbols.filter(s => s.type === 'export');
      expect(exports).toHaveLength(3);
    });

    it('should extract arrow functions correctly', () => {
      const code = `const fetchData = async () => { await axios.get('/data'); };`;
      const symbols = extractSymbols(code, 'test.ts');
      const arrowFuncs = symbols.filter(s => s.name === 'fetchData');
      expect(arrowFuncs.length).toBeGreaterThan(0);
    });

    it('should extract methods correctly', () => {
      const code = `
class Controller {
  async handleRequest(req, res) {
    return res.json({ ok: true });
  }

  public execute() {}
}
      `.trim();

      const symbols = extractSymbols(code, 'test.ts');
      const methods = symbols.filter(s => s.type === 'function');
      expect(methods.length).toBeGreaterThan(0);
    });
  });

  describe('extractSymbols - Python', () => {
    it('should extract Python classes and functions', () => {
      const code = `
import os
import sys
from typing import List

class DataService:
    def __init__(self):
        self.data = []

    def fetch_data(self) -> List[str]:
        return self.data

def process_items(items: List[str]):
    for item in items:
        print(item)
      `.trim();

      const symbols = extractSymbols(code, 'test.py');
      const classes = symbols.filter(s => s.type === 'class');
      const functions = symbols.filter(s => s.type === 'function');
      const imports = symbols.filter(s => s.type === 'import');

      expect(classes).toHaveLength(1);
      expect(classes[0].name).toBe('DataService');
      expect(functions.length).toBeGreaterThanOrEqual(2);
      expect(imports).toHaveLength(3);
    });
  });

  describe('extractSymbols - Go', () => {
    it('should extract Go structures and functions', () => {
      const code = `
package main

import (
  "fmt"
  "os"
)

type User struct {
  Name string
  Age  int
}

func getUser() User {
  return User{Name: "John", Age: 30}
}

func main() {
  fmt.Println("Hello, World!")
}
      `.trim();

      const symbols = extractSymbols(code, 'test.go');
      const types = symbols.filter(s => s.type === 'class');
      const functions = symbols.filter(s => s.type === 'function');
      const imports = symbols.filter(s => s.type === 'import');

      expect(types).toHaveLength(1);
      expect(types[0].name).toBe('User');
      expect(functions.length).toBeGreaterThanOrEqual(2);
      expect(functions.find(f => f.name === 'getUser')).toBeDefined();
      expect(functions.find(f => f.name === 'main')).toBeDefined();
      expect(imports).toHaveLength(2);
    });
  });

  describe('extractSymbols - Rust', () => {
    it('should extract Rust structs and functions', () => {
      const code = `
use std::collections::HashMap;

struct Config {
  name: String,
  port: u16,
}

impl Config {
  fn new(name: String) -> Self {
    Config { name, port: 8080 }
  }
}

fn main() {
  let config = Config::new(String::from("server"));
  println!("{:?}", config);
}
      `.trim();

      const symbols = extractSymbols(code, 'test.rs');
      const structs = symbols.filter(s => s.type === 'class');
      const functions = symbols.filter(s => s.type === 'function');
      const imports = symbols.filter(s => s.type === 'import');

      expect(structs.length).toBeGreaterThan(0);
      expect(functions.length).toBeGreaterThan(0);
      expect(functions.find(f => f.name === 'main')).toBeDefined();
      expect(imports).toHaveLength(1);
    });
  });

  describe('extractSymbols - Java', () => {
    it('should extract Java classes and methods', () => {
      const code = `
import java.util.List;
import java.util.ArrayList;

public class UserService {
  private List<String> users;

  public UserService() {
    this.users = new ArrayList<>();
  }

  public void addUser(String user) {
    users.add(user);
  }

  public List<String> getUsers() {
    return users;
  }
}
      `.trim();

      const symbols = extractSymbols(code, 'test.java');
      const classes = symbols.filter(s => s.type === 'class');
      const functions = symbols.filter(s => s.type === 'function');
      const imports = symbols.filter(s => s.type === 'import');

      expect(classes.length).toBeGreaterThan(0);
      expect(classes.find(c => c.name === 'UserService')).toBeDefined();
      expect(functions.length).toBeGreaterThan(0);
      expect(imports).toHaveLength(2);
    });
  });

  describe('generateFileSummary', () => {
    it('should generate summary with statistics', () => {
      const code = `
import { useState } from 'react';

export class Component {
  constructor() {}
  render() {}
}

export function helper() {
  return true;
}
      `.trim();

      const summary = generateFileSummary('test.ts', code);

      expect(summary.path).toBe('test.ts');
      expect(summary.summary).toContain('test.ts');
      expect(summary.summary).toContain('个导入');
      expect(summary.summary).toContain('个导出');
      expect(summary.summary).toContain('个类');
      expect(summary.summary).toContain('个函数');
    });

    it('should list main symbols in summary', () => {
      const code = `
class UserService {}
function calculateSum() {}
function calculateAverage() {}
      `.trim();

      const summary = generateFileSummary('test.ts', code);

      expect(summary.summary).toContain('类:');
      expect(summary.summary).toContain('函数:');
      expect(summary.symbols.length).toBeGreaterThan(0);
    });

    it('should handle large number of functions', () => {
      const functions = Array.from({ length: 15 }, (_, i) => `function func${i}() {}`);
      const code = functions.join('\n');

      const summary = generateFileSummary('test.ts', code);

      expect(summary.summary).toContain('(还有');
      expect(summary.symbols.length).toBeGreaterThan(10);
    });
  });

  describe('generateMultipleFileSummaries', () => {
    it('should generate summaries for multiple files', async () => {
      const files = [
        { path: 'file1.ts', content: 'export class A {}' },
        { path: 'file2.ts', content: 'export function b() {}' },
        { path: 'file3.ts', content: 'import { x } from "lib"' }
      ];

      const summaries = await generateMultipleFileSummaries(files);

      expect(summaries).toHaveLength(3);
      expect(summaries[0].path).toBe('file1.ts');
      expect(summaries[1].path).toBe('file2.ts');
      expect(summaries[2].path).toBe('file3.ts');
    });
  });

  describe('generateSummaryReport', () => {
    it('should generate report within maxLength', () => {
      const summaries = [
        { path: 'file1.ts', summary: 'File: file1.ts\nSummary for file 1', symbols: [] },
        { path: 'file2.ts', summary: 'File: file2.ts\nSummary for file 2', symbols: [] },
      ];

      const report = generateSummaryReport(summaries, 1000);

      expect(report).toContain('[CODE STRUCTURE SUMMARY]');
      expect(report).toContain('file1.ts');
      expect(report).toContain('file2.ts');
      expect(report.length).toBeLessThanOrEqual(1000);
    });

    it('should truncate when exceeding maxLength', () => {
      const summaries = Array.from({ length: 10 }, (_, i) => ({
        path: `file${i}.ts`,
        summary: `Very long summary for file ${i} that takes up a lot of space `.repeat(10),
        symbols: []
      }));

      const report = generateSummaryReport(summaries, 200);

      expect(report).toContain('(还有');
      expect(report).toContain('个文件未显示');
    });

    it('should include header in report', () => {
      const report = generateSummaryReport([], 100);

      expect(report).toContain('[CODE STRUCTURE SUMMARY]');
    });
  });
});
