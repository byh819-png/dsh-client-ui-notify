/**
 * Notification row slot store: a mirror of the runtime config. The plugin's
 * apply-world change listener is the only writer; the row component reads via
 * props.useStore.
 */
import { defineStore } from '@deepseek-ai/dsh-client-store';
import { DEFAULT_NOTIFY_SETTINGS } from "../notify-settings.js";
/**
 * Declares the notification row state and write surface.
 * @returns the store handle.
 */
export function createNotifyRowStore() {
    return defineStore({
        init: () => ({ config: { ...DEFAULT_NOTIFY_SETTINGS }, revision: -1 }),
        actions: {
            sync: (draft, config, revision) => {
                if (revision <= draft.revision)
                    return;
                draft.config = { ...config };
                draft.revision = revision;
            },
        },
    });
}
//# sourceMappingURL=settings-store.js.map