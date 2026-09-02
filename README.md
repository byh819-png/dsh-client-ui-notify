# dsh-client-ui-notify

[English](README.en.md) | 中文

DeepSeek Harness（dsh）网页端的**铃声提醒插件**：当 AI 回答完成、或需要你授权确认时，自动响铃提醒并弹出右下角提示卡片，让你可以切到别的窗口干别的事，不用担心错过关键节点。

![设置界面截图](images/screenshot.zh.png)

## ✨ 功能

- **回答完成提醒** —— AI 回答结束时响铃，切窗口干活也不会错过
- **需要授权提醒** —— AI 等待你确认（执行命令、提问等）时响铃
- **三种提醒声音**：
  - 🔔 **内置铃声**：双音铃声，开箱即用
  - 🗣️ **文字转语音**：朗读你配置的文字（如"回答完成了"）
  - 🎵 **自定义音频**：上传自己的音频文件（≤1MB），或直接填一个音频链接
- **右下角弹窗**：每次响铃时弹出提示卡片，标明哪个会话、什么事件
- **浏览器系统通知**（可选）：标签页在后台也能收到系统级通知

## 📦 安装

### 前提

已安装 [dsh](https://www.npmjs.com/package/@deepseek-ai/dsh)（`dsh --version` 能正常输出版本号），并至少运行过一次 `dsh web`。

### 方式一：dsh 安装用户（npm）

```bash
dsh plugin --profile web add github:byh819-png/dsh-client-ui-notify
```

### 方式二：deepseek-harness 仓库安装用户

```bash
pnpm dsh plugin --profile web add git+https://github.com/byh819-png/dsh-client-ui-notify.git
```

两种方式均要求仓库中包含构建产物（`lib/` 目录）。

### 安装后

1. 重启 dsh web（Ctrl+C 停掉再重新运行 `dsh web`）
2. 刷新浏览器页面
3. 打开 **设置 → 通用设置**，找到"通知"配置行

`dsh plugin add` 会自动把插件写入 profile 的依赖并在重启后挂载，无需手动编辑任何配置文件。

## ⚙️ 使用

打开 **设置 → 通用设置**，在"通知"一行中：

1. 打开**启用提醒**总开关
2. 按需勾选提醒时机：**回答完成** / **需要授权**
3. 选择**声音类型**并配置：
   - 内置铃声：无需配置
   - 文字转语音：填写要朗读的文字
   - 自定义音频：上传本地文件（≤1MB），或填一个 http(s) 音频链接
4. 可选：打开**系统通知**开关（浏览器会请求通知权限）
5. 点击**试听**按钮可立即播放当前配置的声音（不受总开关影响）

## 🗑️ 卸载

```bash
dsh plugin --profile web remove @deepseek-ai/dsh-client-ui-notify
```

然后重启 dsh web 即可。该命令会同时移除 profile 依赖与插件挂载配置。

> 如果想清理上传过的自定义音频文件，删除目录 `~/.dsh/storages/ui-notify/` 即可。

## ❓ 常见问题

**Q: 设置里看不到"通知"这一行？**
确认插件已安装（`dsh plugin --profile web list`）、dsh web 已重启、浏览器页面已刷新。插件版本需要与 dsh 核心版本匹配（当前适配 `0.1.2-alpha.4`）。

**Q: 事件发生时没有声音？**
浏览器的自动播放策略要求页面先有过用户交互（点击一下页面即可）才会出声。刚打开页面就触发的提醒可能被浏览器静默拦截。

**Q: 系统通知开关不生效？**
需要浏览器授权通知权限。如果权限被拒绝或浏览器不支持，该开关会静默失效（不影响铃声）。

**Q: 启动时报 "does not provide an export named ..." 错误？**
插件版本与 dsh 核心版本不匹配。请将两者更新到互相匹配的版本（本插件当前适配 dsh `0.1.2-alpha.4`）。

## ⚠️ 已知限制

- 弹窗只保留最新一条告警——连续触发时每次都响铃，但弹窗只显示最新事件
- 自定义音频单文件上限 1 MB，仅支持常见音频格式（wav/mp3/ogg/mp4/webm/aac/flac/m4a 等）；更大的文件请改用音频链接
- 两种事件共用同一种铃声，弹窗以颜色区分事件类型

---

## 🔧 开发者备注

<details>
<summary>构建、版本对齐与实现要点（点击展开）</summary>

### 构建

插件使用 [tsdown](https://tsdown.dev/) 构建，构建配置引用 monorepo 根的共享文件 `../tsdown.client.ts`，需在 deepseek-harness monorepo 内执行：

```bash
pnpm run bundle   # tsdown，产物输出到 lib/
```

产物：`lib/index.js`（Host 半）+ `lib/client.js`（浏览器半）+ `lib/types/`（类型声明）。

### 版本对齐

本插件的版本号与 dsh 核心版本保持一致。升级 dsh 核心后需核对以下 API 面（`0.1.1-rc.2` → `0.1.2-alpha.4` 期间的两处破坏性变更）：

- `dsh-client-connection` 不再导出裸函数 `isTrustedApiRequest` —— 信任围栏改由 `connection` 服务的 `requestRejection(req)` 方法承担（Host/Origin 校验 + 浏览器认证，见 `src/index.ts` 的路由注册）
- `dsh-settings` 不再导出 `settingsNamespace()` 包装 —— `settings.register()` 直接收命名空间字符串

### 实现要点

- **所有权规则**：运行时（`NotifyRuntime`）拥有持久化配置与全部播放决策；设置行只是同一份配置的镜像，由单调 revision 把关；Host 拥有唯一的文件字节存储
- **边沿检测**：对会话列表 + pending 交互映射做逐会话 diff。running → idle 触发"回答完成"；出现 pending 交互触发"需要授权"。首个快照只记录不响铃；`connection/reset` 时重新基线，避免重连状态重放伪造边沿
- **用户音频存储**：文件经 webServer 前缀路由（`/_dsh-ui-notify/audio/<uuid>.<ext>`）落入 `$DSH_HOME/storages/ui-notify/audio`，围栏与 `/api` 一致；URL 尾部钉死为规范 UUID + 白名单扩展名；上传上限 1 MB；Host 激活时清扫设置不再引用的孤儿文件（只动符合规范 id 模式的文件）
- **弹窗计时**：`NotifyToast.tsx` 的 `HOLD_MS`/`FADE_MS` 与 `NotifyToast.module.css` 中 `dsh-notify-toast-fade` 动画的延迟/时长必须一致，否则会截断淡出或留下不可见卡片

</details>

## License

[MIT](LICENSE)
