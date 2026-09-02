/**
 * Notification popup slot store: the single currently-shown bottom-right
 * toast. The plugin's apply-world `notify/alert` listener is the only writer
 * (`show` replaces the current toast — the newest alert wins); the popup
 * component dismisses itself after its hold, or the user closes it early.
 */
import { defineStore } from '@deepseek-ai/dsh-client-store';
/**
 * Declares the popup state and write surface.
 * @returns the store handle.
 */
export function createNotifyToastStore() {
    return defineStore({
        init: () => ({ toast: null }),
        actions: {
            show: (draft, toast) => { draft.toast = toast; },
            dismiss: (draft) => { draft.toast = null; },
        },
    });
}
//# sourceMappingURL=toast-store.js.map