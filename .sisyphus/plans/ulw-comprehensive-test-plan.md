# ULW 全面测试计划 - yuangs CLI

**项目**: yuangs CLI (v1.3.42)  
**测试范围**: 全面验证重构后的功能与质量  
**计划日期**: 2026-01-16  
**执行模式**: ULW (Ultra-Lightweight Work) - 零容忍失败

---

## 1. 成功标准（SUCCESS CRITERIA）

### 1.1 功能标准
| 标准 | 验证方式 | 预期结果 |
|------|----------|----------|
| **构建成功** | `npm run build` | 退出码 0，无编译错误，dist/ 目录完整 |
| **单元测试通过** | `npm test` | 所有测试通过，无失败，无 skipped |
| **CLI 帮助可用** | `yuangs --help` | 显示完整帮助信息 |
| **应用列表可用** | `yuangs list` | 显示默认应用（shici, dict, pong） |
| **配置命令可用** | `yuangs config` | 显示配置信息或帮助 |

### 1.2 可观察标准
| 标准 | 验证方式 | 预期结果 |
|------|----------|----------|
| **TypeScript 编译** | `npm run build` | 输出中无 `error TS`，只有纯编译过程 |
| **Jest 测试套件** | `npm test` | 显示 `PASS` 和 `Tests: X passed` |
| **npm 包结构** | `npm pack && tar -tf` | 包含 dist/ 目录，不包含 src/ 目录 |
| **CLI shebang** | `head -1 dist/cli.js` | 显示 `#!/usr/bin/env node` |

### 1.3 通过/失败标准
| 测试项 | 成功条件 |
|--------|----------|
| **构建验证** | `exit code = 0` AND `no error message` |
| **单元测试** | `exit code = 0` AND `all tests pass` |
| **CLI 功能** | 命令不报错且输出符合预期 |
| **包结构** | 包只包含必要文件（dist/），大小合理 |

---

## 2. 测试用例（TEST CASES）

### 2.1 构建验证测试（Build Verification）
```
测试名称: TypeScript 编译与构建
输入: npm run build
预期输出: 
  - Exit code: 0
  - dist/cli.js 存在且包含 shebang
  - dist/ 目录包含所有模块
  - 无 TypeScript 编译错误
验证方式: 检查 exit code + dist/ 目录内容
```

### 2.2 单元测试套件（Unit Tests）
```
测试名称: Jest 单元测试套件
输入: npm test
预期输出:
  - Exit code: 0
  - 测试覆盖: 
    * Module: Macros (5 tests)
    * Module: index.js (7 tests)
    * CLI Integration (2 tests)
  - 全部测试 PASS
验证方式: 检查 Jest 输出摘要
```

### 2.3 CLI 集成测试（CLI Integration）
```
测试名称: CLI 帮助命令
输入: node dist/cli.js --help
预期输出: 显示完整帮助信息（包含版本号、命令列表）
验证方式: 输出包含 "苑广山的个人应用启动器" 和 "当前版本"
```

```
测试名称: CLI 列表命令
输入: node dist/cli.js list
预期输出: 显示默认应用列表（shici, dict, pong）
验证方式: 输出包含应用名称和 URL
```

```
测试名称: CLI 配置命令
输入: node dist/cli.js config
预期输出: 显示配置信息或帮助
验证方式: 不报错且显示配置相关内容
```

### 2.4 包结构验证（Package Structure）
```
测试名称: npm 打包结构
输入: npm pack && tar -tf yuangs-*.tgz
预期输出:
  - 包含 dist/ 目录及其子目录
  - 包含 package.json
  - 不包含 src/ 目录（源码不应发布）
  - 不包含 test/ 目录（测试不应发布）
验证方式: 检查 tar 输出
```

### 2.5 核心模块测试（Core Modules）
```
测试名称: 模块导出验证
输入: node -e "const yuangs = require('./index.js'); console.log(Object.keys(yuangs))"
预期输出: 包含核心函数（urls, openApp, getMacros 等）
验证方式: 检查导出的 keys
```

---

## 3. 执行步骤（EXECUTION STEPS）

### 步骤 1: 环境检查
```bash
# 检查 Node.js 版本
node --version  # 预期: >= 18.x.x

# 检查依赖安装
npm list --depth=0  # 确认所有依赖已安装
```

### 步骤 2: 构建验证
```bash
# 清理旧构建产物
rm -rf dist/

# 执行构建
npm run build

# 验证构建产物
ls -la dist/
head -1 dist/cli.js  # 验证 shebang
```

### 步骤 3: 单元测试
```bash
# 运行测试套件
npm test

# 详细输出（可选）
npm test -- --verbose
```

### 步骤 4: CLI 功能测试
```bash
# 帮助命令
node dist/cli.js --help

# 列表命令
node dist/cli.js list

# 配置命令
node dist/cli.js config
node dist/cli.js config list
```

### 步骤 5: 包结构验证
```bash
# 打包
npm pack

# 检查包内容
tar -tf yuangs-*.tgz | grep -E "^(dist|package.json)" | head -20

# 验证不包含源码
tar -tf yuangs-*.tgz | grep "^src"  # 应该为空
```

### 步骤 6: TypeScript 类型检查
```bash
# TypeScript 编译（隐含在 npm run build 中）
npm run build 2>&1 | grep -i error  # 应该为空
```

---

## 4. 证据收集（EVIDENCE COLLECTION）

### 4.1 构建证据
- [ ] 构建命令输出截图或日志
- [ ] dist/ 目录结构
- [ ] dist/cli.js 第一行（shebang）

### 4.2 测试证据
- [ ] Jest 测试输出摘要
- [ ] 测试通过数量统计
- [ ] 任何失败或跳过的测试（如有）

### 4.3 CLI 证据
- [ ] `yuangs --help` 输出
- [ ] `yuangs list` 输出
- [ ] `yuangs config` 输出

### 4.4 包结构证据
- [ ] `npm pack` 输出
- [ ] `tar -tf` 输出（验证包内容）
- [ ] 包大小信息

---

## 5. 回归测试检查清单（REGRESSION TEST CHECKLIST）

- [ ] 所有现有单元测试通过
- [ ] CLI 命令不报错
- [ ] 配置文件加载正常
- [ ] Macros 功能正常
- [ ] 应用列表加载正常
- [ ] TypeScript 类型检查通过
- [ ] npm 包结构符合预期
- [ ] 不包含不必要的文件（src/, test/, .git 等）

---

## 6. 风险评估（RISK ASSESSMENT）

| 风险项 | 可能性 | 影响 | 缓解措施 |
|--------|--------|------|----------|
| TypeScript 编译错误 | 低 | 高 | 检查 tsconfig.json 配置 |
| 单元测试失败 | 低 | 高 | 检查 mocks 和断言 |
| CLI 命令报错 | 低 | 中 | 验证命令参数解析 |
| 包结构不正确 | 中 | 中 | 检查 package.json.files 字段 |
| Node.js 版本不兼容 | 低 | 高 | 确认 Node.js >= 18 |

---

## 7. 测试执行记录（TEST EXECUTION RECORD）

**执行人**: Planner  
**执行日期**: 2026-01-16  
**执行环境**: Ubuntu Linux, Node.js v18.x

### 执行结果摘要

| 测试项 | 状态 | 说明 |
|--------|------|------|
| 构建验证 | ⬜ 待执行 | - |
| 单元测试 | ⬜ 待执行 | - |
| CLI 集成 | ⬜ 待执行 | - |
| 包结构 | ⬜ 待执行 | - |
| 类型检查 | ⬜ 待执行 | - |

### 总体结论
⬜ **通过** - 所有测试项均成功  
⬜ **失败** - 存在失败项（详见下文）

### 失败详情（如有）
- [ ] 失败项 1: ___________
- [ ] 失败项 2: ___________
- [ ] 失败项 3: ___________

---

## 8. 后续行动（NEXT ACTIONS）

### 如果全部通过
1. 可以安全地推送到 main 分支触发 CI/CD
2. 可以进行 npm publish
3. 更新文档和发布说明

### 如果存在失败
1. 分析失败原因
2. 修复问题
3. 重新执行测试
4. 验证修复有效性

---

**计划版本**: v1.0  
**最后更新**: 2026-01-16  
**审核状态**: 待执行
