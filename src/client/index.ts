/**
 * Notification plugin, browser half: provides the notification runtime (sound
 * playback on answer-complete and authorization-needed edges) and registers
 * its preference row into the settings General section — the feature owns its
 * own settings surface. The Host half (`src/index.ts`) exposes the durable
 * `ui-notify` namespace this row reads and writes.
 */
import type { BoundActions } from '@deepseek-ai/dsh-client-ui-slots'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: the ctx.settingsScope Context merge. Cross-plugin collaboration
// goes through the service, never a value import (client bundle purity gate).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the runtime plugin's Context merge (ctx.sessions).
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import { NOTIFY_SETTINGS_NAMESPACE, type NotifySettings } from '../notify-settings.ts'
import { en, zh, type NotifyKey } from './locales.ts'
import { NotifyRuntime } from './notify-runtime.ts'
import { createNotifyRowStore } from './settings-store.ts'
import { createBrowserEngine } from './sounds.ts'
import { NotifyRow, type NotifyRowInjected } from './NotifyRow.tsx'

export type { NotifyRowComponentProps, NotifyRowInjected } from './NotifyRow.tsx'
export type { NotifyRowState } from './settings-store.ts'
export type { NotifyKey } from './locales.ts'
export type { NotifyMethod, NotifySettings } from '../notify-settings.ts'
export {
  AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, MAX_AUDIO_BYTES,
  audioExtensionOfMediaType, audioMediaTypeOfExtension,
} from '../notify-settings.ts'
export { NotifyRuntime, type SessionObservation } from './notify-runtime.ts'
export { createBrowserEngine, dispatch, type PlaybackEngine } from './sounds.ts'
export { createNotifyRowStore } from './settings-store.ts'
export { NotifyRow } from './NotifyRow.tsx'

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
  }
}

/**
 * Required services: settings transport, the session list observation source,
 * plus slots/locale for the preference row. `remote` carries the forwarded
 * settings invalidation that `bindSettingsScope` subscribes to on this context.
 */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'sessions']

/**
 * Client plugin body: provide the notification runtime and register the
 * feature-owned preference row into the General section's item slot.
 * @param ctx - client cordis context.
 */
export function apply(ctx: ClientContext): void {
  const host = ctx.settingsScope.bind<NotifySettings>({ namespace: NOTIFY_SETTINGS_NAMESPACE })
  const notify = new NotifyRuntime(ctx, host, createBrowserEngine())
  ctx.provide('notify', notify)

  ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-notify: settings row dictionaries')

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
}
