# dsh-client-ui-notify 0.1.2-alpha.1 — 安装说明

DeepSeek Harness Web 的**提醒插件**：回答完成 / 需要授权时播放铃声（内置铃声、文字转语音、
自定义音频）、在右下角弹出提示卡片，并可选择发送浏览器系统通知；在 设置 → 通用设置 中配置。

本分发包**不需要 git**，也不要求插件已发布到 npm。两种安装方式任选。

---

## 方式 A：一键脚本（推荐）

**Windows**：解压后执行 `install.ps1`（PowerShell）：

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

**macOS / Linux**：解压后执行 `install.sh`（bash）：

```bash
bash install.sh
```

脚本会完成三件事（幂等，可重复执行）：
- 把 `package/` 复制到 `$DSH_HOME\profiles\node_modules\@deepseek-ai\dsh-client-ui-notify\`（macOS/Linux 为 `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-client-ui-notify/`）
- 在 `$DSH_HOME\profiles\web\cordis.patch.yml` 追加插件挂载行（已存在则跳过）
- 打印重启提示

**重启 dsh web**，刷新浏览器，打开 设置 → 通用设置 即可看到提醒配置
（**启用提醒** 总开关、**系统通知** 开关、两个事件开关与**声音类型**选择器）。

> `$DSH_HOME` 默认是 `~\.dsh`；若设置了环境变量 `DSH_HOME` 则使用它。
> 脚本只写上面两个位置，不改动其它任何文件。

---

## 方式 B：手动安装（跨平台，Linux / macOS / Windows 通用）

1. 把 `package/` 目录复制为
   `$DSH_HOME/profiles/node_modules/@deepseek-ai/dsh-client-ui-notify/`
   （`$DSH_HOME` 默认 `~/.dsh`）：

   ```bash
   # Linux / macOS
   mkdir -p "$HOME/.dsh/profiles/node_modules/@deepseek-ai"
   cp -r package "$HOME/.dsh/profiles/node_modules/@deepseek-ai/dsh-client-ui-notify"

   # Windows (PowerShell)
   Copy-Item -Recurse .\package (Join-Path $HOME '.dsh\profiles\node_modules\@deepseek-ai\dsh-client-ui-notify')
   ```

2. 在 `$DSH_HOME/profiles/web/cordis.patch.yml` 的数组里加入：

   ```yaml
   - insert:
       - id: ui-notify
         name: '@deepseek-ai/dsh-client-ui-notify'
   ```

3. **重启 dsh web**，刷新浏览器即可。

---

## 提醒说明

- **总开关「启用提醒」** 同时控制铃声与页面内右下角弹窗；两个事件开关决定回答完成 / 需要授权
  是否提醒。
- **「系统通知」开关** 走浏览器 Notification API：打开时会弹出浏览器的通知权限询问，
  授权后标签页在后台也能收到系统通知；权限被拒绝或浏览器不支持时开关不会生效。
- **「声音类型」** 选择提醒声音：内置铃声、文字转语音或自定义音频（支持上传本地文件 ≤ 1MB）。

---

## 为什么这样装：原理

- dsh 的 web profile 从 `$DSH_HOME/profiles/<name>/` 组合插件树，Node 解析插件包时
  会一路向上查找 `node_modules`，`$DSH_HOME/profiles/node_modules` 是 dsh 维护的
  「安装闭包回退」目录——本插件的依赖（cordis、dsh-settings、client runtime 等）
  全部由 dsh 自带闭包提供，因此**无需再安装任何依赖**。
- 插件是普通 `dsh.client` 包（host 半 `lib/index.js` 注册设置命名空间与音频存储路由，
  浏览器半 `lib/client.js` 提供设置行与弹窗），挂载行在 profile 用户层 `cordis.patch.yml`
  中声明，所以必须重启让 Loader 重新组合。

## 已知注意事项

- 安装后插件行只存在于该 profile 的用户层；删除 `cordis.patch.yml` 里那几行即卸载。
- 若你的 dsh 是通过 npm 安装且配置了私有 registry，也可以改用
  `dsh plugin --profile web add <绝对路径>/deepseek-ai-dsh-client-ui-notify-0.1.2-alpha.1.tgz`
  安装（仍需在 `cordis.patch.yml` 加挂载行）；但 tarball 的依赖
  `@deepseek-ai/dsh-settings` 需可从 registry 解析，否则该方式会失败——方式 A/B 无此限制。
- 浏览器自动播放策略：页面需有过用户交互才会出声；刚打开页面就触发提醒时浏览器可能
  静默拦截（插件已降级处理，不会报错）。
- 自定义音频上传到 `$DSH_HOME/storages/ui-notify/audio/`，设置只存 URL 引用；
  上传路由与 `/api` 同信任围栏（仅 loopback）。宿主每次启动会执行保留回收，
  删除设置不再引用的托管文件（只触碰 `<uuid>.<ext>` 规范文件）。
