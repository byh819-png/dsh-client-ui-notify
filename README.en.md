# dsh-client-ui-notify

English | [中文](README.md)

**Ringtone notification plugin for the DeepSeek Harness (dsh) web client**: rings and shows a bottom-right popup when an AI answer completes or when your authorization is needed, so you can switch to other windows without missing key moments.

![Settings screenshot](images/screenshot.png)

## ✨ Features

- **Answer-complete alert** — rings when the AI finishes an answer; never miss it while working in another window
- **Authorization-needed alert** — rings when the AI waits for your confirmation (command execution, questions, etc.)
- **Three sound types**:
  - 🔔 **Built-in ringtone**: a two-tone chime, works out of the box
  - 🗣️ **Text-to-speech**: speaks your configured text (e.g. "Answer ready")
  - 🎵 **Custom audio**: upload your own audio file (≤1 MB) or provide an audio URL
- **Bottom-right popup**: a toast card on every ring, showing which session and which event
- **Browser system notifications** (optional): receive system-level notifications even when the tab is in the background

## 📦 Installation

### Prerequisites

[DeepSeek Harness (dsh)](https://www.npmjs.com/package/@deepseek-ai/dsh) is installed (`dsh --version` prints a version) and `dsh web` has run at least once.

### Option 1: Install from a Git repository

```bash
dsh plugin --profile web add github:byh819-png/dsh-client-ui-notify
```

### Option 2: Install from a Git repository (full URL form)

```bash
dsh plugin --profile web add git+https://github.com/byh819-png/dsh-client-ui-notify.git
```

Both forms are equivalent and require the repository to contain the build output (`lib/` directory), otherwise build locally first.

### After installation

1. Restart dsh web (Ctrl+C, then run `dsh web` again)
2. Refresh the browser page
3. Open **Settings → General** and find the notification row

`dsh plugin add` writes the plugin into the profile's dependencies and mounts it on restart — no manual config editing required.

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

## 🗑️ Uninstallation

```bash
dsh plugin --profile web remove @deepseek-ai/dsh-client-ui-notify
```

Then restart dsh web. The command removes both the profile dependency and the plugin mount.

> To clean up uploaded custom audio files, delete the directory `~/.dsh/storages/ui-notify/`.

## ❓ FAQ

**Q: The notification row doesn't appear in Settings?**
Make sure the plugin is installed (`dsh plugin --profile web list`), dsh web has been restarted, and the browser page refreshed. The plugin version must match the dsh core version (currently adapted to `0.1.2-alpha.4`).

**Q: No sound when an event fires?**
Browser autoplay policy requires prior user interaction with the page (click anywhere once). Alerts fired right after page load may be silently blocked.

**Q: The system notification toggle doesn't work?**
Browser notification permission is required. When permission is denied or the platform doesn't support it, the toggle silently no-ops (the ringtone still works).

**Q: Startup fails with "does not provide an export named ..."?**
The plugin and dsh core versions are out of sync. Update both to matching versions (this plugin currently adapts to dsh `0.1.2-alpha.4`).

## ⚠️ Known Limitations

- The popup keeps only the newest alert — a burst of events rings for each but the toast shows only the latest
- Custom audio is capped at 1 MB per file and accepts common audio formats only (wav/mp3/ogg/mp4/webm/aac/flac/m4a, etc.); use an audio URL for larger files
- Both events share one ringtone; the popup distinguishes event types by accent color

---

## 🔧 Developer Notes

<details>
<summary>Build, version alignment, and implementation notes (click to expand)</summary>

### Build

The plugin builds with [tsdown](https://tsdown.dev/); the build config references the monorepo-root shared file `../tsdown.client.ts`, so build inside the deepseek-harness monorepo:

```bash
pnpm run bundle   # tsdown, output to lib/
```

Artifacts: `lib/index.js` (Host half) + `lib/client.js` (browser half) + `lib/types/` (type declarations).

### Version alignment

The plugin version tracks the dsh core version. After upgrading dsh, verify the following API surface (two breaking changes during `0.1.1-rc.2` → `0.1.2-alpha.4`):

- `dsh-client-connection` no longer exports the bare `isTrustedApiRequest` function — the trust fence now lives on the `connection` service's `requestRejection(req)` method (Host/Origin validation + browser auth; see the route registration in `src/index.ts`)
- `dsh-settings` no longer exports the `settingsNamespace()` wrapper — `settings.register()` takes the namespace string directly

### Implementation notes

- **Ownership rule**: the runtime (`NotifyRuntime`) owns the durable config and every playback decision; the settings row mirrors the same config, gated by a monotonic revision; the Host owns the only file-byte store
- **Edge detection**: per-session diff over the session list + pending-interaction map. running → idle fires "answer complete"; a pending interaction appearing fires "authorization needed". The first snapshot only records; `connection/reset` re-baselines so reconnect replays cannot fabricate edges
- **User-audio store**: files land in `$DSH_HOME/storages/ui-notify/audio` through a webServer prefix route (`/_dsh-ui-notify/audio/<uuid>.<ext>`) fenced like `/api`; the URL tail is pinned to a canonical UUID + whitelisted extension; uploads are capped at 1 MB; a retention sweep at Host activation removes orphaned files (only files matching the canonical id pattern are touched)
- **Popup timing**: `HOLD_MS`/`FADE_MS` in `NotifyToast.tsx` and the `dsh-notify-toast-fade` animation delay/duration in `NotifyToast.module.css` must agree, otherwise the fade is cut short or an invisible card is left behind

</details>

## License

[MIT](LICENSE)
