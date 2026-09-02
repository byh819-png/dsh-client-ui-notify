import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import { type NotifySettings } from '../notify-settings.ts';
import type { createNotifyRowStore } from './settings-store.ts';
/** Backwards-compatible alias for the shared audio size cap. */
export { MAX_AUDIO_BYTES as MAX_CUSTOM_AUDIO_BYTES } from '../notify-settings.ts';
/** Injected business face: the one-field write and the immediate preview. */
export interface NotifyRowInjected {
    /** Persist one notification setting field. */
    setField: <F extends keyof NotifySettings>(field: F, value: NotifySettings[F]) => void;
    /** Play the currently configured method once. */
    preview: () => void;
}
/** Full component props: runtime share + store share + locale seat + injected face. */
export type NotifyRowComponentProps = PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createNotifyRowStore>> & PropsLocale<'settings.notify'> & NotifyRowInjected;
/**
 * Render the notification preference row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export declare function NotifyRow({ t, useStore, setField, preview }: NotifyRowComponentProps): import("react").JSX.Element;
//# sourceMappingURL=NotifyRow.d.ts.map