# 72Hours v2.0.1 部署故障排查

## 问题：无法点击选择角色

### 可能原因和解决方案

#### 1. JavaScript 报错
**检查方法**：
- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页是否有红色错误

**常见问题**：
```
- Uncaught ReferenceError: selectIdentity is not defined
- Failed to fetch /api/config
- CORS error
```

**解决**：
- 确保 `index.html` 中的 `<script>` 标签正确加载
- 检查 API 服务是否正常运行

#### 2. API 服务未启动或端口错误
**检查方法**：
```bash
# 在阿里云 ECS 上执行
curl http://localhost:80/health
curl http://localhost:80/api/config
```

**如果失败**：
- 检查服务是否运行：`ps aux | grep node`
- 检查端口监听：`netstat -tlnp | grep :80`

#### 3. 前端文件不完整
**检查方法**：
```bash
# 在阿里云 ECS 上执行
ls -la /opt/72hours/public/
cat /opt/72hours/public/index.html | grep "selectIdentity"
```

**应该看到**：
```html
<div class="identity-card" data-identity="scholar" onclick="selectIdentity('scholar')">
```

#### 4. 权限问题（80端口）
**Linux 非 root 用户无法绑定 80 端口**

**解决方案 A - 使用 root 运行**：
```bash
sudo node dist/src/server/index.js
```

**解决方案 B - 使用 PM2**：
```bash
sudo npm install -g pm2
sudo pm2 start dist/src/server/index.js --name 72hours
```

**解决方案 C - 使用 Nginx 反向代理**：
```nginx
server {
    listen 80;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### 快速修复步骤

1. **停止现有服务**：
```bash
pkill -f "node dist/src/server/index.js"
pm2 delete 72hours 2>/dev/null || true
```

2. **重新部署**：
```bash
cd /opt/72hours
git pull origin main  # 或重新解压部署包
npm install
npm run build
```

3. **使用 root 启动**：
```bash
sudo node dist/src/server/index.js
```

4. **测试**：
```bash
curl http://localhost:80/health
curl http://localhost:80/api/config
```

### 验证前端文件

确保 `public/index.html` 包含以下内容：

```html
<!-- 身份选择卡片 -->
<div class="identity-card" data-identity="scholar" onclick="selectIdentity('scholar')">
    ...
</div>

<!-- JavaScript 函数 -->
<script>
function selectIdentity(identity) {
    selectedIdentity = identity;
    document.querySelectorAll('.identity-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-identity="${identity}"]`).classList.add('selected');
    document.getElementById('start-btn').classList.add('active');
}
</script>
```

### 阿里云安全组检查

确保阿里云控制台安全组允许 HTTP (80) 入站：
1. 登录阿里云控制台
2. 进入 ECS 实例详情
3. 点击"安全组"
4. 确认有规则：
   - 协议类型: TCP
   - 端口范围: 80/80
   - 授权对象: 0.0.0.0/0

### 联系支持

如果以上步骤无法解决问题，请提供：
1. 浏览器 Console 的错误截图
2. ECS 上的服务状态：`ps aux | grep node`
3. 端口监听状态：`netstat -tlnp | grep :80`
