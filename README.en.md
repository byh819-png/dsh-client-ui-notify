---
description: "Sound-alert plugin for the dsh web client: rings and shows a bottom-right popup on answer-complete and authorization-needed edges; built-in ringtone, text-to-speech, or a custom audio file, configured from a General settings row."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-notify

English | [中文](README.zh.md)

## Summary

**Ringtone notification plugin for the DeepSeek Harness (dsh) web client**: rings and shows a bottom-right popup when an AI answer completes or when your authorization is needed, so you can switch to other windows without missing key moments.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Uninstallation](#uninstallation)
- [FAQ](#faq)
- [Dev Note](#dev-note)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

![Settings screenshot](images/screenshot.png)

<a id="features"></a>
## ✨ Features

- **Answer-complete alert** — rings when the AI finishes an answer; never miss it while working in another window
- **Authorization-needed alert** — rings when the AI waits for your confirmation (command execution, questions, etc.)
- **Three sound types**:
  - 🔔 **Built-in ringtone**: a two-tone chime, works out of the box
  - 🗣️ **Text-to-speech**: speaks your configured text (e.g. "Answer ready")
  - 🎵 **Custom audio**: upload your own audio file (≤1 MB) or provide an audio URL
- **Bottom-right popup**: a toast card on every ring, showing which session and which event
- **Browser system notifications** (optional): receive system-level notifications even when the tab is in the background

<a id="installation"></a>
## 📦 Installation

### Prerequisites

[DeepSeek Harness (dsh)](https://www.npmjs.com/package/@deepseek-ai/dsh) is installed (`dsh --version` prints a version) and `dsh web` has run at least once.

### Option 1: dsh users (npm install)

```bash
dsh plugin --profile web add github:byh819-png/dsh-client-ui-notify
```

### Option 2: deepseek-harness monorepo users

```bash
pnpm dsh plugin --profile web add git+https://github.com/byh819-png/dsh-client-ui-notify.git
```

Both options require the repository to contain the build output (`lib/` directory).

### After installation

1. Restart dsh web (Ctrl+C, then run `dsh web` again)
2. Refresh the browser page
3. Open **Settings → General** and find the notification row

`dsh plugin add` writes the plugin into the profile's dependencies and mounts it on restart — no manual config editing required.

<a id="usage"></a>
## ⚙️ Usage

Open **Settings → General**, and in the notification row:

1. Turn on the **Enable notifications** master switch
2. Pick when to ring: **answer complete** / **authorization needed**
3. Choose the **sound type** and configure it:
   - Built-in ringtone: nothing to configure
   - Text-to-speech: enter the text to speak
   - Custom audio: upload a local file (≤1 MB) or enter an http(s) audio URL
4. Optional: enable **system notifications** (the browser asks for permission)
5. The **preview** button plays the currently configured sound immediately (independent of the master switch)

<a id="uninstallation"></a>
## 🗑️ Uninstallation

```bash
dsh plugin --profile web remove @deepseek-ai/dsh-client-ui-notify
```

Then restart dsh web. The command removes both the profile dependency and the plugin mount.

> To clean up uploaded custom audio files, delete the directory `~/.dsh/storages/ui-notify/`.

<a id="faq"></a>
## ❓ FAQ

**Q: The notification row doesn't appear in Settings?** Make sure the plugin is installed (`dsh plugin --profile web list`), dsh web has been restarted, and the browser page refreshed. The plugin version must match the dsh core version (currently adapted to `0.1.5-rc.2`).

**Q: No sound when an event fires?** Browser autoplay policy requires prior user interaction with the page (click anywhere once). Alerts fired right after page load may be silently blocked.

**Q: The system notification toggle doesn't work?** Browser notification permission is required. When permission is denied or the platform doesn't support it, the toggle silently no-ops (the ringtone still works).

**Q: Startup fails with "does not provide an export named ..."?** The plugin and dsh core versions are out of sync. Update both to matching versions (this plugin currently adapts to dsh `0.1.5-rc.2`).

<a id="dev-note"></a>
## Dev Note

<details>
<summary>Build, version alignment, and implementation notes — click to expand</summary>

### Build

The package builds with [tsdown](https://tsdown.dev/) through the repository's shared client preset `../tsdown.client.ts`, from inside the monorepo:

```bash
pnpm run bundle
```

Artifacts: `lib/index.js` (Host half), `lib/client.js` (browser half), and `lib/types/` (declarations).

### Version alignment

The package version tracks the dsh core version. Re-check the API surface this package touches after a core upgrade; the following broke between `0.1.2-alpha.1` and `0.1.5-rc.2`:

- `dsh-settings` dropped the `settingsNamespace()` wrapper — `settings.register()` takes the namespace string directly, and `import type {} from '@deepseek-ai/dsh-settings'` is what activates the `ctx.settings` merge.
- The trust fence is no longer a bare `isTrustedApiRequest` export of `dsh-client-connection` — a route registrant injects the `connection` service and calls `requestRejection(req)`, which applies the Host/Origin checks plus browser authentication to another Web route.
- The client runtime share gained `usePanelInfo` and `useResource`; component specs stub both.
- An empty `./invariant` companion is rejected — a package without a diverging runtime observation states the reason in its README instead.
- Styling gates: a full-round radius pairs with `corner-shape: round`, neutral solid borders are `0.5px`, and an elevated surface carries no neutral border.

### Implementation notes

The package realizes one ownership rule: the runtime owns the durable section and every playback decision, the settings row mirrors the same config, and the Host owns the only byte store in the seam.

- **Edge detection**: `NotifyRuntime` adopts the settings scope and diffs the session list plus the pending-interaction map against a per-session mirror. Running → idle fires "answer complete"; a pending interaction appearing fires "authorization needed". The first snapshot only records (sessions already idle at load ring nothing), and `connection/reset` re-baselines so reconnect status replays cannot fabricate edges.
- **User-audio store**: the custom-method file lands in `$DSH_HOME/storages/ui-notify/audio` through a webServer prefix route (`/_dsh-ui-notify/audio/<uuid>.<ext>`) whose registrant applies the connection trust fence first. The URL tail is pinned to a canonical UUID plus a whitelisted extension before any file is touched; uploads are bounded at 1 MB and the response carries an immutable cache header because the id names the content. A retention sweep at Host activation removes files the setting no longer references, touching only files matching the canonical id pattern.
- **Settings row and popup**: the row registers into the General section's item slot with a store mirroring the runtime config, gated by the runtime's monotonic revision so stale duplicates never render. The popup registers into the shell's floating overlay seat; the newest alert wins (replaces the current toast), holds, fades, then dismisses itself or on user close. The card renders through a body portal and stays click-through so an announcement never blocks the app underneath. It sits 4px above the viewport bottom edge so it clears the composer's authorization action row.
- **System-notification click**: the sender focuses the harness tab, dismisses the notification, then makes the alerted session current — the authorization prompt an alert announces is on screen when the user follows it.
- **Popup timing**: `HOLD_MS`/`FADE_MS` in `NotifyToast.tsx` and the `dsh-notify-toast-fade` animation delay/duration in `NotifyToast.module.css` must agree, or a mismatch cuts the fade or leaves an invisible card behind.
- **Related packages**: [ui-settings](../ui-settings/README.md) owns the settings-namespace scope the row's transport rides; [ui-settings-general](../ui-settings-general/README.md) hosts the General section; [ui-session](../ui-session/README.md) owns the pending-interaction root the runtime observes; [settings](../../settings/README.md) owns the durable user-settings seam and its file provider.

</details>

### License

[MIT](LICENSE)

## Model Experience

None, as the package is a browser-side notification UI; it registers nothing model-facing.

#### KV Cache effect

None; the plugin assembles no provider request and adds no session event of its own.

## Known Limitations and Deferred Work

- The popup keeps only the newest alert — a burst of events rings for each but the toast shows only the latest
- Custom audio is capped at 1 MB per file and accepts common audio formats only (wav/mp3/ogg/mp4/webm/aac/flac/m4a, etc.); use an audio URL for larger files
- Both events share one ringtone; the popup distinguishes event types by accent color

**Runtime invariant:** No companion is published. The settings scope is the single authority for the durable section, and the browser runtime emits `notify/config` synchronously with the mutations it makes, so no independent observation can diverge.
