/**
 * Host registration for the notification plugin: exposes the durable
 * `ui-notify` settings namespace so the browser row can read and write it,
 * serves the user-picked custom audio through a trust-fenced webServer route
 * (`/_dsh-ui-notify/audio/<id>.<ext>`) so file bytes never enter the settings
 * document, and sweeps orphaned hosted audio on activation.
 */
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
import { AUDIO_URL_PREFIX, NOTIFY_SETTINGS_NAMESPACE, NotifySettingsSchema } from "./notify-settings.js";
import { handleAudioRequest, sweepOrphanedAudio } from "./audio-store.js";
export { AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, DEFAULT_NOTIFY_SETTINGS, MAX_AUDIO_BYTES, NOTIFY_FIELDS, NOTIFY_METHODS, NOTIFY_SETTINGS_NAMESPACE, audioExtensionOfMediaType, audioMediaTypeOfExtension, isNotifyMethod, } from "./notify-settings.js";
export { audioStorageDir, handleAudioRequest, sweepOrphanedAudio } from "./audio-store.js";
const NOTIFY_NAMESPACE = settingsNamespace(NOTIFY_SETTINGS_NAMESPACE);
/**
 * Register the durable notification section when the settings provider is
 * composed (the browser row's scope reads and writes through this namespace),
 * the user-audio route when an HTTP server is composed, and — once the
 * section is registered — sweep hosted audio the setting no longer references.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export function apply(ctx) {
    ctx.inject(['settings'], (settingsCtx) => {
        const scope = settingsCtx.settings.register(NOTIFY_NAMESPACE, NotifySettingsSchema);
        // Retention sweep: the setting's customAudioUrl is the only reference into
        // the audio store; hand-edited settings, uploads whose settings write
        // never landed, and failed eager cleanups all leave orphans behind. Runs
        // once per activation; a failure is logged, never fatal.
        void sweepOrphanedAudio(scope.get().customAudioUrl).catch((error) => {
            settingsCtx.logger.warn('client-ui-notify: audio retention sweep failed', error);
        });
    });
    ctx.inject(['webServer'], (httpCtx) => {
        httpCtx.effect(() => httpCtx.webServer.register({
            kind: 'prefix',
            path: AUDIO_URL_PREFIX,
            handler: handleAudioRequest,
        }), 'client-ui-notify: user-audio route');
    });
}
//# sourceMappingURL=index.js.map