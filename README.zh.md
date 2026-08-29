---
description: "dsh Web 客户端的提示音插件：在回答完成与需要授权的事件边上响铃并弹出右下角卡片；支持内置铃声、文字转语音或自定义音频文件，在 General 设置行配置。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-notify

[English](README.md) | 中文

## 概述

`dsh-client-ui-notify` 是 dsh Web 客户端的浏览器通知插件：观察会话列表与 pending 交互映射，在某个会话回答完成或需要授权时播放声音、为每次响铃弹出短暂的右下角卡片，并可发送浏览器系统通知。播放方式可在 General 设置行配置——内置双音铃声、按配置文本朗读的文字转语音，或通过信任围栏保护的 Host 路由上传的自定义音频文件（durable 设置只存服务 URL，不存文件字节）。Host 半区注册 durable 的 `ui-notify` 设置命名空间、提供用户音频路由，并在激活时清扫孤儿音频。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与暂缓事项](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

Web shell 像其他 `dsh.client` 行一样组合本插件；用户打开 General 设置区前它不渲染任何内容，打开后出现通知行。该行拥有总开关、系统通知通道（首次开启时请求浏览器权限）、两个事件开关、声音类型选择器和各方法输入——每个控件通过运行时写入一个 durable 字段，设置传输保持在单一所有者之后。

### 启用提醒

打开总开关即布防响铃；两个事件开关选择响铃的边沿（回答完成、需要授权，或两者），系统通知开关为每次响铃追加一条浏览器通知。试听按钮立即播放当前配置的方法，不受总开关影响。

### 选择声音

内置铃声无需配置。文字转语音通过平台合成器朗读配置文本。自定义方法接受 http(s) 链接或不超过 1 MB 的本地音频文件；选中的文件上传到 Host 路由，设置只存服务 URL，文件字节不会撑大设置文档。替换文件时删除旧文件。

### 可观察的成功与失败

一个触发的边沿播放声音并 emit `notify/alert`；系统开关打开时额外 emit `notify/system`。弹窗跟随总开关与事件开关，没有独立开关。方法配置错误、TTS 文本为空、自定义 URL 缺失、系统通知未授权或平台不支持音频时降级为 no-op，不会从事件处理器抛错。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部——点击展开</summary>

本包贯彻一条所有权规则：运行时拥有 durable 设置与每次播放决策，设置行镜像同一份配置，Host 拥有该接缝中唯一的字节存储。

### 边沿检测

`NotifyRuntime` 采纳设置作用域，并将会话列表与 pending 交互映射与逐会话镜像做 diff。running → idle 触发"回答完成"；出现 pending 交互触发"需要授权"。首个快照只记录（加载时已空闲的会话不响铃），`connection/reset` 时重新基线，重连的状态重放不会伪造边沿。每个触发的边沿播放配置的声音，并在所属上下文中 emit `notify/alert` 与可选的 `notify/system` 事件。

### 用户音频存储

自定义方法的文件经 webServer 前缀路由（`/_dsh-ui-notify/audio/<uuid>.<ext>`）落入 `$DSH_HOME/storages/ui-notify/audio`，路由与 `/api` 特权方法共用同一 loopback 信任围栏。URL 尾部先被钉死为规范 UUID 加白名单扩展名，才允许触碰文件；上传上限 1 MB，响应带 immutable 缓存头（id 即内容标识）。Host 激活时的保留清扫删除设置不再引用的文件，且只动匹配规范 id 模式的文件。

### 设置行与弹窗

设置行注册进 General 区的 item 槽，带一个镜像运行时配置的 store，由运行时单调 revision 把关，过期副本永不渲染。弹窗注册进 shell 的浮动 overlay 席位；最新告警胜出（替换当前 toast），保持、淡出后自行关闭或由用户关闭。卡片经 body portal 渲染并保持点击穿透，通知永不遮挡下层应用。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

以下页面覆盖本插件所组合的表面。

- [ui-settings](../ui-settings/README.zh.md) —— 设置行传输所依赖的设置命名空间作用域服务。
- [ui-settings-general](../ui-settings-general/README.zh.md) —— 承载 General 区的设置外壳。
- [ui-session](../ui-session/README.zh.md) —— 运行时观察的 pending 交互根。
- [settings](../../settings/README.zh.md) —— durable 用户设置接缝及其文件提供者。

-----

<a id="model-experience"></a>
## 模型体验

无，因为本包是浏览器侧通知 UI，不注册任何面向模型的内容。

#### KV Cache 影响

无；本插件不组装任何 provider 请求，也不新增自己的会话事件。

## 已知限制与暂缓事项

<a id="known-limitations-and-deferred-work"></a>

以下限制定义了通知接缝无法触达之处；它们是当前包的约束。

- **弹窗只保留最新一条告警**——连续触发的边沿每次都响铃，但只折叠为最新 toast；没有通知队列。
- **系统通知需要浏览器授权**——设置行在首次开启时请求权限；未授权或平台不支持时该通道静默 no-op。
- **自定义音频单文件上限 1 MB**，且只接受白名单音频扩展名；更大的或非常规文件需改用 http(s) 链接。
- **铃声固定**——两种边沿共用内置的双音铃声；弹窗以强调色区分类型，而非声音。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

弹窗的保持与淡出计时分布在两处且必须一致：`NotifyToast.tsx` 中的 `HOLD_MS`/`FADE_MS` 与 `NotifyToast.module.css` 中 `dsh-notify-toast-fade` 动画的延迟/时长——不一致会截断淡出或留下不可见卡片。用户音频路由与 `/api` 共用 `isTrustedApiRequest` 围栏；请保持仅 loopback。

</details>
