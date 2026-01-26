# yuangs CLI - 一键编译安装指南

## 快速开始

### 基本安装

```bash
./install-latest.sh
```

这个命令会：
1. 检查 Node.js 版本（需要 >= 18）
2. 清理旧的构建产物
3. 安装项目依赖
4. 执行 TypeScript 构建
5. 自动卸载旧版本
6. 安装到本地环境（npm link）
7. 验证安装结果

### 安装并运行测试

**运行完整测试套件：**
```bash
./install-latest.sh --test
```

**仅运行 XResolver 测试（快速验证）：**
```bash
./install-latest.sh --xresolver-test
```

这个命令会在安装前运行快速的核心功能测试，特别适合开发过程中的快速验证。

### 跳过构建（如果已构建）

```bash
./install-latest.sh --skip-build
```

如果之前已经构建过，可以使用这个选项跳过构建步骤。

## 使用说明

安装完成后，可以使用以下命令：

```bash
# 查看版本
yuangs --version

# 查看帮助
yuangs --help

# 执行具体命令
yuangs <command>
```

## 卸载

```bash
npm unlink -g yuangs
```

## 脚本选项

| 选项 | 说明 |
|------|------|
| `--test`, `-t` | 安装前运行完整测试套件 |
| `--xresolver-test`, `-x` | 仅运行 XResolver 相关测试（快速验证） |
| `--skip-build` | 跳过构建步骤（使用现有构建产物） |
| `--help`, `-h` | 显示帮助信息 |

## 开发工作流

1. **开发阶段**：修改代码
2. **快速验证**：运行 `./install-latest.sh --xresolver-test`（快速核心功能测试）
3. **完整测试**：运行 `./install-latest.sh --test`（包含完整测试套件）
4. **快速重装**：运行 `./install-latest.sh --skip-build`（如果已构建）
5. **验证安装**：运行 `yuangs --version` 和 `yuangs --help`

## 测试修复说明

本次更新修复了 XResolver 相关的测试问题：

1. **FastScanner 路径问题**：修复了 ripgrep 返回相对路径导致的文件找不到问题
2. **导入模式匹配**：增强了模块导入检测的完整性
3. **XResolver 测试**：所有 13 个 XResolver 测试用例现已通过

现在可以使用 `--xresolver-test` 选项快速验证核心功能是否正常工作。

## 注意事项

- 需要全局安装 npm 的权限
- 脚本会自动卸载旧版本的 yuangs
- 如果遇到权限问题，可能需要使用 `sudo npm link`
