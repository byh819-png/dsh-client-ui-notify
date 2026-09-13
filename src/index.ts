/**
 * Host registration for the notification plugin: exposes the durable
 * `ui-notify` settings namespace so the browser row can read and write it,
 * serves the user-picked custom audio through a trust-fenced webServer route
 * (`/_dsh-ui-notify/audio/<id>.<ext>`) so file bytes never enter the settings
 * document, and sweeps orphaned hosted audio on activation.
 */

import type { Context } from '@deepseek-ai/cordis'
// Activates the settings, webServer, and connection Context merges used below.
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-client-connection'
import { AUDIO_URL_PREFIX, NOTIFY_SETTINGS_NAMESPACE, NotifySettingsSchema } from './notify-settings.ts'
import { handleAudioRequest, sweepOrphanedAudio } from './audio-store.ts'

export {
  AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, DEFAULT_NOTIFY_SETTINGS,
  MAX_AUDIO_BYTES, NOTIFY_FIELDS, NOTIFY_METHODS, NOTIFY_SETTINGS_NAMESPACE,
  audioExtensionOfMediaType, audioMediaTypeOfExtension, isNotifyMethod,
  type NotifyMethod, type NotifySettings,
} from './notify-settings.ts'
export { audioStorageDir, handleAudioRequest, sweepOrphanedAudio } from './audio-store.ts'

/**
 * Register the durable notification section when the settings provider is
 * composed (the browser row's scope reads and writes through this namespace),
 * the user-audio route when an HTTP server is composed, and — once the
 * section is registered — sweep hosted audio the setting no longer references.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    const scope = settingsCtx.settings.register(NOTIFY_SETTINGS_NAMESPACE, NotifySettingsSchema)
    // Retention sweep: the setting's customAudioUrl is the only reference into
    // the audio store; hand-edited settings, uploads whose settings write
    // never landed, and failed eager cleanups all leave orphans behind. Runs
    // once per activation; a failure is logged, never fatal.
    void sweepOrphanedAudio(scope.get().customAudioUrl).catch((error: unknown) => {
      settingsCtx.logger.warn('client-ui-notify: audio retention sweep failed', error)
    })
  })
  ctx.inject(['webServer', 'connection'], (httpCtx) => {
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'prefix',
      path: AUDIO_URL_PREFIX,
      handler: async (req, res) => {
        // The connection service owns the browser-trust decision for every
        // Host route, `/api` included. The audio bytes clear the same check
        // before any file is touched.
        const rejection = httpCtx.connection.requestRejection(req)
        if (rejection !== undefined) {
          res.writeHead(rejection)
          res.end(rejection === 401 ? 'unauthorized' : 'forbidden')
          return
        }
        await handleAudioRequest(req, res)
      },
    }), 'client-ui-notify: user-audio route')
  })
}
