/**
 * Durable settings of the notification plugin, shared by the Host schema
 * (`src/index.ts`) and the browser scope (`src/client/index.ts`).
 */
import z from '@deepseek-ai/schemastery';
/** Settings namespace owned by the notification plugin. */
export const NOTIFY_SETTINGS_NAMESPACE = 'ui-notify';
/** Built-in notification methods accepted at the registry and settings boundaries. */
export const NOTIFY_METHODS = ['builtin', 'tts', 'custom'];
/** Largest local audio file accepted for the custom method (protects host storage). */
export const MAX_AUDIO_BYTES = 1024 * 1024;
/** URL prefix of the host-side user-audio route (see `src/index.ts`). */
export const AUDIO_URL_PREFIX = '/_dsh-ui-notify/audio';
/** Canonical UUID pattern of one stored audio id (path-segment safety: no separators). */
export const AUDIO_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
/** Stored filename extension → audio media type (the URL carries the extension, so the route answers with the right type). */
export const AUDIO_EXTENSION_MEDIA_TYPES = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    mp4: 'audio/mp4',
    webm: 'audio/webm',
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    aiff: 'audio/x-aiff',
    aif: 'audio/x-aiff',
    wma: 'audio/x-ms-wma',
    mid: 'audio/midi',
    midi: 'audio/midi',
};
/** Media type → stored extension (upload-side inverse of {@link AUDIO_EXTENSION_MEDIA_TYPES}). */
const AUDIO_MEDIA_TYPE_EXTENSIONS = Object.fromEntries(Object.entries(AUDIO_EXTENSION_MEDIA_TYPES).map(([extension, mediaType]) => [mediaType, extension]));
/**
 * Resolve the stored extension for one declared audio media type, falling back
 * to the file-name extension when the browser reports an empty type (some
 * systems leave `file.type` blank for audio files).
 * @param mediaType - the file picker's `file.type` value.
 * @param fileName - the picked file's name, used as the empty-type fallback.
 * @returns the lowercase extension, or undefined when neither source is accepted.
 */
export function audioExtensionOfMediaType(mediaType, fileName) {
    const byType = mediaType === ''
        ? undefined
        : AUDIO_MEDIA_TYPE_EXTENSIONS[mediaType] ?? (mediaType === 'audio/x-wav' ? 'wav' : undefined);
    if (byType !== undefined)
        return byType;
    if (fileName === undefined)
        return undefined;
    const dot = fileName.lastIndexOf('.');
    if (dot < 0)
        return undefined;
    const byName = fileName.slice(dot + 1).toLowerCase();
    return byName in AUDIO_EXTENSION_MEDIA_TYPES ? byName : undefined;
}
/**
 * Resolve the media type for one stored audio extension.
 * @param extension - lowercase extension from the route path.
 * @returns the media type, or undefined when unknown.
 */
export function audioMediaTypeOfExtension(extension) {
    return AUDIO_EXTENSION_MEDIA_TYPES[extension];
}
/** Field names of the durable section (the row writes one field per control). */
export const NOTIFY_FIELDS = {
    /** Master switch: whether notifications are enabled at all. */
    enabled: 'enabled',
    /** Whether a browser system notification accompanies the sound. */
    systemNotify: 'systemNotify',
    /** Ring when a session's answer finishes (running → idle edge). */
    onAnswerComplete: 'onAnswerComplete',
    /** Ring when a session needs authorization (approval/question pending). */
    onAuthRequired: 'onAuthRequired',
    /** Playback method: built-in ringtone, text-to-speech, or a custom audio file. */
    method: 'method',
    /** Text spoken by the TTS method. */
    ttsText: 'ttsText',
    /** Custom audio source (http(s) URL or data URL) played by the custom method. */
    customAudioUrl: 'customAudioUrl',
};
/** Default section when the user-settings document has no override. */
export const DEFAULT_NOTIFY_SETTINGS = {
    enabled: false,
    systemNotify: false,
    onAnswerComplete: true,
    onAuthRequired: true,
    method: 'builtin',
    ttsText: '回答完成',
    customAudioUrl: '',
};
/** Durable notification schema; also the wire envelope the browser scope validates against. */
export const NotifySettingsSchema = z.object({
    [NOTIFY_FIELDS.enabled]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.enabled),
    [NOTIFY_FIELDS.systemNotify]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.systemNotify),
    [NOTIFY_FIELDS.onAnswerComplete]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.onAnswerComplete),
    [NOTIFY_FIELDS.onAuthRequired]: z.boolean().default(DEFAULT_NOTIFY_SETTINGS.onAuthRequired),
    [NOTIFY_FIELDS.method]: z.union([...NOTIFY_METHODS]).default(DEFAULT_NOTIFY_SETTINGS.method),
    [NOTIFY_FIELDS.ttsText]: z.string().default(DEFAULT_NOTIFY_SETTINGS.ttsText),
    [NOTIFY_FIELDS.customAudioUrl]: z.string().default(DEFAULT_NOTIFY_SETTINGS.customAudioUrl),
});
/**
 * Narrow one wire or registry value to a persistable method.
 * @param value - value crossing the settings or registry boundary.
 * @returns whether the value is a built-in method.
 */
export function isNotifyMethod(value) {
    return NOTIFY_METHODS.some(method => method === value);
}
//# sourceMappingURL=notify-settings.js.map