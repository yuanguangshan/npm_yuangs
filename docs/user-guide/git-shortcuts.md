# Git 短参数指南

| 命令 | 短参数 | 说明 |
|------|--------|------|
| `git review` | `-l` | 审查级别 (quick/standard/deep) |
| | `-f` | 特定文件 |
| | `-u` | 未暂存变更 |
| | `-c` | 指定 commit |
| `git commit` | `-a` | 暂存所有 |
| | `-d` | 详细 message |
| | `-t` | 指定类型 |
| `git auto` | `-y` | 跳过确认 |
| `git exec` | `-f` | 特定文件 |

示例：
```bash
yuangs git review -l deep -f src/app.ts
yuangs git commit -a -d
yuangs git auto -y
```
