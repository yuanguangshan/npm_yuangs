# yuangs SSH 使用示例

## 目录

1. [基础连接示例](#基础连接示例)
2. [治理功能演示](#治理功能演示)
3. [配置文件示例](#配置文件示例)
4. [实际场景示例](#实际场景示例)

---

## 基础连接示例

### 示例 1: 使用默认私钥连接

```bash
# 连接到远程服务器 (使用 ~/.ssh/id_rsa)
yuangs ssh admin@192.168.1.100

# 输出:
# 🔐 Connecting to admin@192.168.1.100:22...
# ✅ Connected to 192.168.1.100
# 🛡️  AI Governance enabled
# 📝 All commands will be audited
#
# admin@server:~$
```

### 示例 2: 指定端口和私钥

```bash
# 使用自定义端口和私钥
yuangs ssh deploy@prod-server.com -p 2222 -i ~/.ssh/deploy_key

# 或者
yuangs ssh deploy@prod-server.com:2222 -i ~/.ssh/deploy_key
```

### 示例 3: 使用配置文件

创建 `~/.yuangs/ssh_config.json`:

```json
{
  "hosts": {
    "dev": {
      "host": "dev.example.com",
      "port": 22,
      "username": "developer",
      "privateKey": "/Users/you/.ssh/id_rsa"
    },
    "staging": {
      "host": "staging.example.com",
      "port": 22,
      "username": "deploy",
      "privateKey": "/Users/you/.ssh/staging_key"
    },
    "prod": {
      "host": "prod-web-01.example.com",
      "port": 22,
      "username": "admin",
      "privateKey": "/Users/you/.ssh/prod_key"
    }
  }
}
```

然后直接使用别名:

```bash
yuangs ssh dev
yuangs ssh staging
yuangs ssh prod
```

---

## 治理功能演示

### 示例 4: 安全命令 - 直接执行

```bash
$ yuangs ssh user@host

user@host:~$ ls -la
# ✅ 命令直接执行,显示文件列表
total 48
drwxr-xr-x  6 user user 4096 Jan 25 09:00 .
drwxr-xr-x 12 root root 4096 Jan 20 10:30 ..
-rw-r--r--  1 user user  220 Jan 20 10:30 .bash_logout
...

user@host:~$ cat /etc/hostname
# ✅ 只读命令,直接执行
prod-web-01
```

### 示例 5: 危险命令 - 被拦截

```bash
user@host:~$ rm -rf /

🚫 [GOVERNANCE BLOCK]
   Reason: Detected potentially destructive command
   Risk Level: R3
   Impact: This command could cause irreversible system damage

user@host:~$ dd if=/dev/zero of=/dev/sda

🚫 [GOVERNANCE BLOCK]
   Reason: Detected potentially destructive command
   Risk Level: R3
   Impact: This command could cause irreversible system damage

user@host:~$ mkfs.ext4 /dev/sda1

🚫 [GOVERNANCE BLOCK]
   Reason: Detected potentially destructive command
   Risk Level: R3
   Impact: This command could cause irreversible system damage
```

### 示例 6: sudo 提权流程

```bash
user@host:~$ sudo systemctl restart nginx

# AI 评估 sudo 命令...
# ✅ 审批通过,进入密码输入阶段

[sudo] password for user: ********

# ✅ 密码验证成功,命令执行
# 注意: 密码输入不会被记录或分析

user@host:~$ whoami
user

user@host:~$ sudo su -

# AI 评估 su 命令...
# ✅ 审批通过

[sudo] password for user: ********

root@host:~# whoami
root

root@host:~# exit
logout

user@host:~$ whoami
user
```

### 示例 7: sudo 命令被拒绝

```bash
user@host:~$ sudo rm -rf /var/log/*

🚫 [GOVERNANCE BLOCK]
   Reason: Sudo execution blocked: Detected potentially destructive command
   Risk Level: R2
```

---

## 配置文件示例

### 示例 8: 多环境配置

`~/.yuangs/ssh_config.json`:

```json
{
  "hosts": {
    "dev-web": {
      "host": "dev-web-01.internal",
      "port": 22,
      "username": "developer",
      "privateKey": "/Users/you/.ssh/dev_key"
    },
    "dev-db": {
      "host": "dev-db-01.internal",
      "port": 22,
      "username": "developer",
      "privateKey": "/Users/you/.ssh/dev_key"
    },
    "staging-web": {
      "host": "staging-web-01.example.com",
      "port": 22,
      "username": "deploy",
      "privateKey": "/Users/you/.ssh/staging_key"
    },
    "prod-web-01": {
      "host": "prod-web-01.example.com",
      "port": 22,
      "username": "admin",
      "privateKey": "/Users/you/.ssh/prod_key"
    },
    "prod-web-02": {
      "host": "prod-web-02.example.com",
      "port": 22,
      "username": "admin",
      "privateKey": "/Users/you/.ssh/prod_key"
    },
    "prod-db": {
      "host": "prod-db-01.example.com",
      "port": 22,
      "username": "dba",
      "privateKey": "/Users/you/.ssh/dba_key"
    }
  }
}
```

使用:

```bash
# 开发环境
yuangs ssh dev-web
yuangs ssh dev-db

# 预发布环境
yuangs ssh staging-web

# 生产环境
yuangs ssh prod-web-01
yuangs ssh prod-web-02
yuangs ssh prod-db
```

---

## 实际场景示例

### 示例 9: 日常运维操作

```bash
$ yuangs ssh prod-web-01

# 1. 检查系统状态
user@prod-web-01:~$ uptime
 09:15:32 up 45 days,  3:42,  1 user,  load average: 0.52, 0.48, 0.45

# 2. 查看磁盘使用
user@prod-web-01:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   28G   20G  59% /
/dev/sdb1       100G   45G   50G  48% /data

# 3. 查看服务状态
user@prod-web-01:~$ systemctl status nginx
● nginx.service - A high performance web server
   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
   Active: active (running) since Mon 2026-01-25 09:00:00 UTC

# 4. 查看日志 (最后 20 行)
user@prod-web-01:~$ tail -n 20 /var/log/nginx/access.log
# ✅ 只读操作,直接执行

# 5. 需要重启服务 - 使用 sudo
user@prod-web-01:~$ sudo systemctl restart nginx
[sudo] password for user: ********
# ✅ 服务重启成功
```

### 示例 10: 应急故障处理

```bash
$ yuangs ssh prod-web-01

# 1. 发现磁盘空间不足
user@prod-web-01:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   48G   1.2G  98% /

# 2. 查找大文件
user@prod-web-01:~$ sudo du -sh /var/log/* | sort -hr | head -10
[sudo] password for user: ********
15G     /var/log/nginx
8.5G    /var/log/application
2.1G    /var/log/syslog

# 3. 清理旧日志 (需要谨慎)
user@prod-web-01:~$ sudo find /var/log/nginx -name "*.log.gz" -mtime +30 -delete
# ✅ 清理 30 天前的压缩日志

# 4. 验证空间
user@prod-web-01:~$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   35G   13G  74% /
# ✅ 空间释放成功
```

### 示例 11: 数据库维护

```bash
$ yuangs ssh prod-db

# 1. 连接数据库
user@prod-db:~$ mysql -u root -p
Enter password: ********

# 2. 查看数据库状态
mysql> SHOW DATABASES;
mysql> SHOW PROCESSLIST;

# 3. 执行备份
user@prod-db:~$ sudo mysqldump -u root -p myapp > /backup/myapp_$(date +%Y%m%d).sql
[sudo] password for user: ********
# ✅ 备份成功

# 4. 验证备份
user@prod-db:~$ ls -lh /backup/
-rw-r--r-- 1 root root 2.3G Jan 25 09:30 myapp_20260125.sql
```

### 示例 12: 代码部署

```bash
$ yuangs ssh staging-web

# 1. 切换到部署目录
deploy@staging:~$ cd /var/www/myapp

# 2. 拉取最新代码
deploy@staging:/var/www/myapp$ git pull origin develop
Already up to date.

# 3. 安装依赖
deploy@staging:/var/www/myapp$ npm install
# ✅ 依赖安装成功

# 4. 构建项目
deploy@staging:/var/www/myapp$ npm run build
# ✅ 构建成功

# 5. 重启服务
deploy@staging:/var/www/myapp$ sudo systemctl restart myapp
[sudo] password for deploy: ********
# ✅ 服务重启成功

# 6. 验证服务
deploy@staging:/var/www/myapp$ curl http://localhost:3000/health
{"status":"ok","version":"1.2.3"}
```

---

## 高级用法

### 示例 13: 使用 passphrase 保护的私钥

```bash
# 如果你的私钥有 passphrase 保护
yuangs ssh user@host -i ~/.ssh/protected_key

# 系统会提示输入 passphrase
Enter passphrase for key '/Users/you/.ssh/protected_key': ********
```

### 示例 14: 临时使用密码认证

```bash
# 不推荐,但在紧急情况下可用
yuangs ssh user@host --password yourpassword

# 更安全的方式是交互式输入
yuangs ssh user@host
# 如果没有找到私钥,会提示输入密码
```

---

## 常见工作流

### 工作流 1: 每日运维检查

```bash
#!/bin/bash
# daily_check.sh

echo "=== 检查 Web 服务器 ==="
yuangs ssh prod-web-01 << 'EOF'
echo "1. 系统负载:"
uptime
echo ""
echo "2. 磁盘使用:"
df -h
echo ""
echo "3. 内存使用:"
free -h
echo ""
echo "4. Nginx 状态:"
systemctl status nginx --no-pager
exit
EOF

echo ""
echo "=== 检查数据库服务器 ==="
yuangs ssh prod-db << 'EOF'
echo "1. 系统负载:"
uptime
echo ""
echo "2. MySQL 状态:"
systemctl status mysql --no-pager
exit
EOF
```

### 工作流 2: 批量服务器操作

```bash
#!/bin/bash
# batch_update.sh

SERVERS=("prod-web-01" "prod-web-02" "prod-web-03")

for server in "${SERVERS[@]}"; do
    echo "=== 更新 $server ==="
    yuangs ssh $server << 'EOF'
sudo apt-get update
sudo apt-get upgrade -y
exit
EOF
    echo ""
done
```

---

## 故障排查

### 问题 1: 连接被拒绝

```bash
$ yuangs ssh user@host
❌ SSH connection failed: Connection refused

# 解决方案:
# 1. 检查主机是否可达
ping host

# 2. 检查端口是否开放
telnet host 22

# 3. 检查 SSH 服务状态 (需要其他方式登录)
systemctl status sshd
```

### 问题 2: 认证失败

```bash
$ yuangs ssh user@host
❌ SSH connection failed: Authentication failed

# 解决方案:
# 1. 检查用户名是否正确
# 2. 检查私钥路径
ls -la ~/.ssh/id_rsa

# 3. 检查私钥权限
chmod 600 ~/.ssh/id_rsa

# 4. 尝试使用密码认证
yuangs ssh user@host --password yourpassword
```

### 问题 3: 命令被意外拦截

```bash
$ yuangs ssh user@host

user@host:~$ rm /tmp/old_file.txt

🚫 [GOVERNANCE BLOCK]
   Reason: Detected potentially destructive command
   Risk Level: R3

# 这是误报,因为治理规则太严格
# 未来版本将支持自定义规则和白名单
```

---

## 下一步

- 查看 [完整文档](./README.md)
- 了解 [架构设计](./IMPLEMENTATION_PLAN.md)
- 阅读 [快速开始](./QUICKSTART.md)

## 反馈

如有问题或建议,请提交 Issue!
