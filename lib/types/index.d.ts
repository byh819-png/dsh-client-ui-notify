/**
 * Host registration for the notification plugin: exposes the durable
 * `ui-notify` settings namespace so the browser row can read and write it,
 * serves the user-picked custom audio through a trust-fenced webServer route
 * (`/_dsh-ui-notify/audio/<id>.<ext>`) so file bytes never enter the settings
 * document, and sweeps orphaned hosted audio on activation.
 */
import type { Context } from '@deepseek-ai/cordis';
export { AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, DEFAULT_NOTIFY_SETTINGS, MAX_AUDIO_BYTES, NOTIFY_FIELDS, NOTIFY_METHODS, NOTIFY_SETTINGS_NAMESPACE, audioExtensionOfMediaType, audioMediaTypeOfExtension, isNotifyMethod, type NotifyMethod, type NotifySettings, } from './notify-settings.ts';
export { audioStorageDir, handleAudioRequest, sweepOrphanedAudio } from './audio-store.ts';
/**
 * Register the durable notification section when the settings provider is
 * composed (the browser row's scope reads and writes through this namespace),
 * the user-audio route when an HTTP server is composed, and — once the
 * section is registered — sweep hosted audio the setting no longer references.
 * @param ctx - Host context that may acquire settings and HTTP services.
 */
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map