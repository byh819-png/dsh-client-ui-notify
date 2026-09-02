/**
 * Durable settings of the notification plugin, shared by the Host schema
 * (`src/index.ts`) and the browser scope (`src/client/index.ts`).
 */
import z from '@deepseek-ai/schemastery';
/** Settings namespace owned by the notification plugin. */
export declare const NOTIFY_SETTINGS_NAMESPACE = "ui-notify";
/** Built-in notification methods accepted at the registry and settings boundaries. */
export declare const NOTIFY_METHODS: readonly ["builtin", "tts", "custom"];
/** Notification playback method. */
export type NotifyMethod = typeof NOTIFY_METHODS[number];
/** Largest local audio file accepted for the custom method (protects host storage). */
export declare const MAX_AUDIO_BYTES: number;
/** URL prefix of the host-side user-audio route (see `src/index.ts`). */
export declare const AUDIO_URL_PREFIX = "/_dsh-ui-notify/audio";
/** Canonical UUID pattern of one stored audio id (path-segment safety: no separators). */
export declare const AUDIO_ID_PATTERN: RegExp;
/** Stored filename extension → audio media type (the URL carries the extension, so the route answers with the right type). */
export declare const AUDIO_EXTENSION_MEDIA_TYPES: Record<string, string>;
/**
 * Resolve the stored extension for one declared audio media type, falling back
 * to the file-name extension when the browser reports an empty type (some
 * systems leave `file.type` blank for audio files).
 * @param mediaType - the file picker's `file.type` value.
 * @param fileName - the picked file's name, used as the empty-type fallback.
 * @returns the lowercase extension, or undefined when neither source is accepted.
 */
export declare function audioExtensionOfMediaType(mediaType: string, fileName?: string): string | undefined;
/**
 * Resolve the media type for one stored audio extension.
 * @param extension - lowercase extension from the route path.
 * @returns the media type, or undefined when unknown.
 */
export declare function audioMediaTypeOfExtension(extension: string): string | undefined;
/** Field names of the durable section (the row writes one field per control). */
export declare const NOTIFY_FIELDS: {
    /** Master switch: whether notifications are enabled at all. */
    readonly enabled: "enabled";
    /** Whether a browser system notification accompanies the sound. */
    readonly systemNotify: "systemNotify";
    /** Ring when a session's answer finishes (running → idle edge). */
    readonly onAnswerComplete: "onAnswerComplete";
    /** Ring when a session needs authorization (approval/question pending). */
    readonly onAuthRequired: "onAuthRequired";
    /** Playback method: built-in ringtone, text-to-speech, or a custom audio file. */
    readonly method: "method";
    /** Text spoken by the TTS method. */
    readonly ttsText: "ttsText";
    /** Custom audio source (http(s) URL or data URL) played by the custom method. */
    readonly customAudioUrl: "customAudioUrl";
};
/** Durable notification section shared by the Host schema and the browser scope. */
export interface NotifySettings {
    enabled: boolean;
    systemNotify: boolean;
    onAnswerComplete: boolean;
    onAuthRequired: boolean;
    method: NotifyMethod;
    ttsText: string;
    customAudioUrl: string;
}
/** Default section when the user-settings document has no override. */
export declare const DEFAULT_NOTIFY_SETTINGS: NotifySettings;
/** Durable notification schema; also the wire envelope the browser scope validates against. */
export declare const NotifySettingsSchema: z<NotifySettings>;
/**
 * Narrow one wire or registry value to a persistable method.
 * @param value - value crossing the settings or registry boundary.
 * @returns whether the value is a built-in method.
 */
export declare function isNotifyMethod(value: unknown): value is NotifyMethod;
//# sourceMappingURL=notify-settings.d.ts.map