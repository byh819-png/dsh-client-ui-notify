/**
 * Host registration for the notification plugin: exposes the durable
 * `ui-notify` settings namespace so the browser row can read and write it, and
 * serves the user-picked custom audio through a trust-fenced webServer route
 * (`/_dsh-ui-notify/audio/<id>.<ext>`) so file bytes never enter the settings
 * document.
 */

import type { Context } from '@deepseek-ai/cordis'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
// Activates the webServer Context merge used by the route registration below.
import type {} from '@deepseek-ai/dsh-host-webserver'
import { AUDIO_URL_PREFIX, NOTIFY_SETTINGS_NAMESPACE, NotifySettingsSchema } from './notify-settings.ts'
import { handleAudioRequest } from './audio-store.ts'

export {
  AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, DEFAULT_NOTIFY_SETTINGS,
  MAX_AUDIO_BYTES, NOTIFY_FIELDS, NOTIFY_METHODS, NOTIFY_SETTINGS_NAMESPACE,
  audioExtensionOfMediaType, audioMediaTypeOfExtension, isNotifyMethod,
  type NotifyMethod, type NotifySettings,
} from './notify-settings.ts'
export { audioStorageDir, handleAudioRequest } from './audio-store.ts'

const NOTIFY_NAMESPACE = settingsNamespace(NOTIFY_SETTINGS_NAMESPACE)

/**
 * Register the durable notification section when the settings provider is
 * composed (the browser row's scope reads and writes through this namespace)
 * and the user-audio route when an HTTP server is composed.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(NOTIFY_NAMESPACE, NotifySettingsSchema)
  })
  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'prefix',
      path: AUDIO_URL_PREFIX,
      handler: handleAudioRequest,
    }), 'client-ui-notify: user-audio route')
  })
}
