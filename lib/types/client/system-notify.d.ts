/**
 * Browser system-notification sender: the Notification API channel of the
 * plugin. Guarded so a missing or unpermitted Notification never throws from
 * an event handler; the tag makes consecutive alerts replace each other in
 * the OS notification center instead of stacking.
 */
/** Tag shared by every notification this plugin sends (replacement key). */
export declare const SYSTEM_NOTIFICATION_TAG = "dsh-ui-notify";
/**
 * Show one system notification. A no-op when the platform capability is
 * absent (jsdom tests, unsupported browsers) or permission was not granted.
 * @param title - short localized alert copy (the notification's title line).
 * @param body - detail line, the session label.
 */
export declare function showSystemNotification(title: string, body: string): void;
//# sourceMappingURL=system-notify.d.ts.map