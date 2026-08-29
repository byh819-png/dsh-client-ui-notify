/**
 * Notification plugin, browser half: provides the notification runtime (sound
 * playback on answer-complete and authorization-needed edges), a bottom-right
 * popup and a browser system notification that accompany every fired edge, and
 * registers its preference row into the settings General section — the feature
 * owns its own settings and overlay surfaces. The Host half (`src/index.ts`)
 * exposes the durable `ui-notify` namespace this row reads and writes.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-store'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: the ctx.settingsScope Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the shell.overlay SlotMap declaration from the layout plugin.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the slot registry Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the uiSession service Context merge (ctx.uiSession).
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls the session-controller client's Context merge (ctx.sessions).
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import { NOTIFY_SETTINGS_NAMESPACE, type NotifySettings } from '../notify-settings.ts'
import { en, zh, type NotifyKey } from './locales.ts'
import { NotifyRuntime, type NotifyAlert } from './notify-runtime.ts'
import { createNotifyRowStore } from './settings-store.ts'
import { createBrowserEngine } from './sounds.ts'
import { showSystemNotification } from './system-notify.ts'
import { NotifyRow, type NotifyRowInjected } from './NotifyRow.tsx'
import { createNotifyToastStore } from './toast-store.ts'
import { NotifyToast } from './NotifyToast.tsx'

export type { NotifyRowComponentProps, NotifyRowInjected } from './NotifyRow.tsx'
export type { NotifyRowState } from './settings-store.ts'
export type { NotifyKey } from './locales.ts'
export type { NotifyMethod, NotifySettings } from '../notify-settings.ts'
export {
  AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, MAX_AUDIO_BYTES,
  audioExtensionOfMediaType, audioMediaTypeOfExtension,
} from '../notify-settings.ts'
export { NotifyRuntime, type AlertKind, type NotifyAlert, type SessionObservation } from './notify-runtime.ts'
export { createBrowserEngine, dispatch, type PlaybackEngine } from './sounds.ts'
export { createNotifyRowStore } from './settings-store.ts'
export { SYSTEM_NOTIFICATION_TAG, showSystemNotification } from './system-notify.ts'
export { NotifyRow } from './NotifyRow.tsx'
export { createNotifyToastStore, type NotifyToastItem, type NotifyToastState } from './toast-store.ts'
export { NotifyToast, type NotifyToastComponentProps } from './NotifyToast.tsx'

/** Namespace owning this feature's settings-row copy. */
export const SETTINGS_NS = 'settings.notify'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The notification settings row's copy. */
    'settings.notify': NotifyKey
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    notify: NotifyRuntime
  }
  interface Events {
    /**
     * The accepted notification settings changed (user write, scope adoption,
     * or reconnect re-read).
     * @param config - the full accepted section (immutable snapshot).
     * @mode emit
     */
    'notify/config'(config: NotifySettings): void
    /**
     * One notification edge fired (answer complete or authorization needed).
     * Emitted for every ring: the bottom-right popup follows the master
     * switch and the event toggles, with no separate toggle.
     * @param alert - the fired edge.
     * @mode emit
     */
    'notify/alert'(alert: NotifyAlert): void
    /**
     * One notification edge fired while the system-notification toggle is on
     * (answer complete or authorization needed). Emitted alongside the sound,
     * so the system notification shares the master switch and the event
     * toggles with the ringtone while keeping its own enable.
     * @param alert - the fired edge.
     * @mode emit
     */
    'notify/system'(alert: NotifyAlert): void
  }
}

/**
 * Required services: settings transport, the session list observation source,
 * plus slots/locale for the preference row. `remote` carries the forwarded
 * settings invalidation that `bindSettingsScope` subscribes to on this context.
 */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'sessions', 'uiSession']

/**
 * Client plugin body: provide the notification runtime, register the
 * feature-owned preference row into the General section's item slot, register
 * the bottom-right popup into the shell's floating overlay seat, and send
 * browser system notifications for the system channel.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const host = ctx.settingsScope.bind<NotifySettings>({ namespace: NOTIFY_SETTINGS_NAMESPACE })
  const notify = new NotifyRuntime(ctx, host, createBrowserEngine())
  ctx.provide('notify', notify)

  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-notify: settings row dictionaries')
  const systemCopy = ctx.locale.bind(SETTINGS_NS)

  const store = createNotifyRowStore()
  let bound: BoundActions<typeof store> | undefined
  const sync = (): void => {
    bound?.sync(notify.getConfig(), notify.revision)
  }
  ctx.on('notify/config', sync)
  const injected = (actions: BoundActions<typeof store>): NotifyRowInjected => {
    bound = actions
    // Re-sync from the getter so no event is lost between registration and
    // first render (the store's revision guard drops stale duplicates).
    sync()
    return {
      setField: (field, value) => { notify.setField(field, value) },
      preview: () => { notify.preview() },
    }
  }
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'notify',
    order: 20,
    store,
    locale: SETTINGS_NS,
    inject: injected,
  }, NotifyRow))

  // Bottom-right popup in the shell's floating overlay seat: the alert
  // listener replaces the current toast (the newest alert wins); the popup
  // dismisses itself after its hold or on user close.
  const toastStore = createNotifyToastStore()
  let toastBound: BoundActions<typeof toastStore> | undefined
  let toastSeq = 0
  ctx.on('notify/alert', (alert) => {
    toastSeq += 1
    toastBound?.show({ ...alert, seq: toastSeq })
  })
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'notify',
    order: 30,
    store: toastStore,
    locale: SETTINGS_NS,
    inject: (actions: BoundActions<typeof toastStore>) => {
      toastBound = actions
      return {}
    },
  }, NotifyToast))

  // Browser system notification channel: the sender no-ops unless the
  // platform exposes Notification with granted permission.
  ctx.on('notify/system', (alert) => {
    const title = alert.kind === 'answer-complete'
      ? systemCopy('notify.system.answerComplete')
      : systemCopy('notify.system.authRequired')
    showSystemNotification(title, alert.title)
  })
}
