import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type NotifySettings } from '../notify-settings.ts';
import { type NotifyKey } from './locales.ts';
import { NotifyRuntime, type NotifyAlert } from './notify-runtime.ts';
export type { NotifyRowComponentProps, NotifyRowInjected } from './NotifyRow.tsx';
export type { NotifyRowState } from './settings-store.ts';
export type { NotifyKey } from './locales.ts';
export type { NotifyMethod, NotifySettings } from '../notify-settings.ts';
export { AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, MAX_AUDIO_BYTES, audioExtensionOfMediaType, audioMediaTypeOfExtension, } from '../notify-settings.ts';
export { NotifyRuntime, type AlertKind, type NotifyAlert, type SessionObservation } from './notify-runtime.ts';
export { createBrowserEngine, dispatch, type PlaybackEngine } from './sounds.ts';
export { createNotifyRowStore } from './settings-store.ts';
export { SYSTEM_NOTIFICATION_TAG, showSystemNotification } from './system-notify.ts';
export { NotifyRow } from './NotifyRow.tsx';
export { createNotifyToastStore, type NotifyToastItem, type NotifyToastState } from './toast-store.ts';
export { NotifyToast, type NotifyToastComponentProps } from './NotifyToast.tsx';
/** Namespace owning this feature's settings-row copy. */
export declare const SETTINGS_NS = "settings.notify";
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The notification settings row's copy. */
        'settings.notify': NotifyKey;
    }
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        notify: NotifyRuntime;
    }
    interface Events {
        /**
         * The accepted notification settings changed (user write, scope adoption,
         * or reconnect re-read).
         * @param config - the full accepted section (immutable snapshot).
         * @mode emit
         */
        'notify/config'(config: NotifySettings): void;
        /**
         * One notification edge fired (answer complete or authorization needed).
         * Emitted for every ring: the bottom-right popup follows the master
         * switch and the event toggles, with no separate toggle.
         * @param alert - the fired edge.
         * @mode emit
         */
        'notify/alert'(alert: NotifyAlert): void;
        /**
         * One notification edge fired while the system-notification toggle is on
         * (answer complete or authorization needed). Emitted alongside the sound,
         * so the system notification shares the master switch and the event
         * toggles with the ringtone while keeping its own enable.
         * @param alert - the fired edge.
         * @mode emit
         */
        'notify/system'(alert: NotifyAlert): void;
    }
}
/**
 * Required services: settings transport, the session list observation source,
 * plus slots/locale for the preference row. `remote` carries the forwarded
 * settings invalidation that `bindSettingsScope` subscribes to on this context.
 */
export declare const inject: string[];
/**
 * Client plugin body: provide the notification runtime, register the
 * feature-owned preference row into the General section's item slot, register
 * the bottom-right popup into the shell's floating overlay seat, and send
 * browser system notifications for the system channel.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map