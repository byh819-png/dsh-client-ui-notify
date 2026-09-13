/**
 * Browser system-notification sender: the Notification API channel of the
 * plugin. Guarded so a missing or unpermitted Notification never throws from
 * an event handler; the tag makes consecutive alerts replace each other in
 * the OS notification center instead of stacking.
 */

/** Tag shared by every notification this plugin sends (replacement key). */
export const SYSTEM_NOTIFICATION_TAG = 'dsh-ui-notify'

/**
 * Show one system notification. A no-op when the platform capability is
 * absent (jsdom tests, unsupported browsers) or permission was not granted.
 * Clicking the notification focuses the harness tab and dismisses the
 * notification before running the caller's action, so the action's own
 * navigation is visible on the tab the user just asked for.
 * @param title - short localized alert copy (the notification's title line).
 * @param body - detail line, the session label.
 * @param open - the action a click runs (the caller opens the alerted session).
 */
export function showSystemNotification(title: string, body: string, open: () => void): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const notification = new Notification(title, { body, tag: SYSTEM_NOTIFICATION_TAG })
  notification.onclick = () => {
    window.focus()
    notification.close()
    open()
  }
}
