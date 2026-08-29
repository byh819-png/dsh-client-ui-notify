---
description: "Sound-alert plugin for the dsh web client: rings and shows a bottom-right popup on answer-complete and authorization-needed edges; built-in ringtone, text-to-speech, or a custom audio file, configured from a General settings row."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-notify

English | [中文](README.zh.md)

## Summary

`dsh-client-ui-notify` is the browser notification plugin for the dsh web client: it observes the session list and pending-interaction map, plays a sound when a session's answer completes or a session needs authorization, shows a transient bottom-right popup for every ring, and can send a browser system notification. The playback method is user-configurable from a General settings row — a bundled two-tone ringtone, text-to-speech over the configured text, or a custom audio file uploaded through a trust-fenced Host route (the durable setting stores the served URL, never the file bytes). The Host half registers the durable `ui-notify` settings namespace, serves the user-audio route, and sweeps orphaned audio on activation.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The web shell composes this plugin like any other `dsh.client` row; it renders nothing until the user opens the General settings section, where the notification row appears. The row owns the master switch, the system-notification channel (requesting browser permission on first enable), the two event toggles, the sound-type selector, and the method inputs — every control writes one durable field through the runtime, so the settings transport stays behind one owner.

### Enabling the alert

Turn on the master switch to arm the ringtone; the two event toggles pick which edges ring (answer complete, authorization needed, or both), and the system-notification switch adds a browser Notification per ring. The preview button plays the currently configured method immediately, independent of the master switch.

### Choosing a sound

The built-in ringtone needs no setup. Text-to-speech speaks the configured text through the platform synthesizer. The custom method accepts an http(s) URL or a local audio file up to 1 MB; a picked file uploads to the Host route and the setting stores the served URL, so file bytes never bloat the settings document. Replacing the file deletes the previous one.

### Observable success and failures

A fired edge plays the sound and emits `notify/alert`; with the system toggle on it also emits `notify/system`. The popup follows the master switch and the event toggles, with no separate toggle. A misconfigured method, an empty TTS text, a missing custom URL, an unpermitted Notification, or a platform without audio support degrades to a no-op instead of throwing from an event handler.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The package realizes one ownership rule: the runtime owns the durable section and every playback decision, the settings row mirrors the same config, and the Host owns the only byte store in the seam.

### Edge detection

`NotifyRuntime` adopts the settings scope and diffs the session list plus the pending-interaction map against a per-session mirror. Running → idle fires "answer complete"; a pending interaction appearing fires "authorization needed". The first snapshot only records (sessions already idle at load ring nothing), and `connection/reset` re-baselines so reconnect status replays cannot fabricate edges. Each fired edge plays the configured sound and emits the `notify/alert` and optional `notify/system` events on the owning context.

### User-audio store

The custom-method file lands in `$DSH_HOME/storages/ui-notify/audio` through a webServer prefix route (`/_dsh-ui-notify/audio/<uuid>.<ext>`) guarded by the same loopback trust fence as the `/api` privileged methods. The URL tail is pinned to a canonical UUID plus a whitelisted extension before any file is touched; uploads are bounded at 1 MB and the response carries an immutable cache header because the id names the content. A retention sweep at Host activation removes files the setting no longer references, touching only files matching the canonical id pattern.

### Settings row and popup

The row registers into the General section's item slot with a store mirroring the runtime config, gated by the runtime's monotonic revision so stale duplicates never render. The popup registers into the shell's floating overlay seat; the newest alert wins (replaces the current toast), holds, fades, then dismisses itself or on user close. The card renders through a body portal and stays click-through so an announcement never blocks the app underneath.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

These pages cover the surfaces this plugin composes into.

- [ui-settings](../ui-settings/README.md) — the settings-namespace scope service the row's transport rides.
- [ui-settings-general](../ui-settings-general/README.md) — the settings shell hosting the General section.
- [ui-session](../ui-session/README.md) — the pending-interaction root the runtime observes.
- [settings](../../settings/README.md) — the durable user-settings seam and its file provider.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side notification UI; it registers nothing model-facing.

#### KV Cache effect

None; the plugin assembles no provider request and adds no session event of its own.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define where the notification seam cannot reach; they are current package constraints.

- **The popup keeps only the newest alert** — a burst of fired edges rings for each but collapses to the latest toast; there is no notification queue.
- **System notifications require the browser grant** — the row requests permission on first enable; without the grant or platform support the channel silently no-ops.
- **Custom audio is capped at 1 MB** per file and accepts only whitelisted audio extensions; larger or exotic files must use an http(s) URL instead.
- **The ringtone is fixed** — one bundled two-tone chime for both edges; the popup distinguishes kinds by accent color, not sound.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The popup's hold and fade timings live in two places that must agree: `HOLD_MS`/`FADE_MS` in `NotifyToast.tsx` and the `dsh-notify-toast-fade` animation delay/duration in `NotifyToast.module.css` — a mismatch cuts the fade or leaves an invisible card behind. The user-audio route trusts the same `isTrustedApiRequest` pin as `/api`; keep it loopback-only.

</details>
