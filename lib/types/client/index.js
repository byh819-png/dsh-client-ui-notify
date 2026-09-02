import { NOTIFY_SETTINGS_NAMESPACE } from "../notify-settings.js";
import { en, zh } from "./locales.js";
import { NotifyRuntime } from "./notify-runtime.js";
import { createNotifyRowStore } from "./settings-store.js";
import { createBrowserEngine } from "./sounds.js";
import { showSystemNotification } from "./system-notify.js";
import { NotifyRow } from "./NotifyRow.js";
import { createNotifyToastStore } from "./toast-store.js";
import { NotifyToast } from "./NotifyToast.js";
export { AUDIO_EXTENSION_MEDIA_TYPES, AUDIO_ID_PATTERN, AUDIO_URL_PREFIX, MAX_AUDIO_BYTES, audioExtensionOfMediaType, audioMediaTypeOfExtension, } from "../notify-settings.js";
export { NotifyRuntime } from "./notify-runtime.js";
export { createBrowserEngine, dispatch } from "./sounds.js";
export { createNotifyRowStore } from "./settings-store.js";
export { SYSTEM_NOTIFICATION_TAG, showSystemNotification } from "./system-notify.js";
export { NotifyRow } from "./NotifyRow.js";
export { createNotifyToastStore } from "./toast-store.js";
export { NotifyToast } from "./NotifyToast.js";
/** Namespace owning this feature's settings-row copy. */
export const SETTINGS_NS = 'settings.notify';
/**
 * Required services: settings transport, the session list observation source,
 * plus slots/locale for the preference row. `remote` carries the forwarded
 * settings invalidation that `bindSettingsScope` subscribes to on this context.
 */
export const inject = ['slots', 'locale', 'connection', 'remote', 'settingsScope', 'sessions', 'uiSession'];
/**
 * Client plugin body: provide the notification runtime, register the
 * feature-owned preference row into the General section's item slot, register
 * the bottom-right popup into the shell's floating overlay seat, and send
 * browser system notifications for the system channel.
 * @param ctx - client cordis context.
 */
export function apply(ctx) {
    const host = ctx.settingsScope.bind({ namespace: NOTIFY_SETTINGS_NAMESPACE });
    const notify = new NotifyRuntime(ctx, host, createBrowserEngine());
    ctx.provide('notify', notify);
    ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), 'ui-notify: settings row dictionaries');
    const systemCopy = ctx.locale.bind(SETTINGS_NS);
    const store = createNotifyRowStore();
    let bound;
    const sync = () => {
        bound?.sync(notify.getConfig(), notify.revision);
    };
    ctx.on('notify/config', sync);
    const injected = (actions) => {
        bound = actions;
        // Re-sync from the getter so no event is lost between registration and
        // first render (the store's revision guard drops stale duplicates).
        sync();
        return {
            setField: (field, value) => { notify.setField(field, value); },
            preview: () => { notify.preview(); },
        };
    };
    ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'notify',
        order: 20,
        store,
        locale: SETTINGS_NS,
        inject: injected,
    }, NotifyRow));
    // Bottom-right popup in the shell's floating overlay seat: the alert
    // listener replaces the current toast (the newest alert wins); the popup
    // dismisses itself after its hold or on user close.
    const toastStore = createNotifyToastStore();
    let toastBound;
    let toastSeq = 0;
    ctx.on('notify/alert', (alert) => {
        toastSeq += 1;
        toastBound?.show({ ...alert, seq: toastSeq });
    });
    ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'notify',
        order: 30,
        store: toastStore,
        locale: SETTINGS_NS,
        inject: (actions) => {
            toastBound = actions;
            return {};
        },
    }, NotifyToast));
    // Browser system notification channel: the sender no-ops unless the
    // platform exposes Notification with granted permission.
    ctx.on('notify/system', (alert) => {
        const title = alert.kind === 'answer-complete'
            ? systemCopy('notify.system.answerComplete')
            : systemCopy('notify.system.authRequired');
        showSystemNotification(title, alert.title);
    });
}
//# sourceMappingURL=index.js.map