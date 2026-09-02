import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots';
import type { createNotifyToastStore } from './toast-store.ts';
/** Full composed props: runtime share + store share + locale seat. */
export type NotifyToastComponentProps = PropsRuntime<'shell.overlay'> & PropsStore<ReturnType<typeof createNotifyToastStore>> & PropsLocale<'settings.notify'>;
/**
 * Render the current popup, or nothing while none is shown.
 * @param props - composed slot props.
 * @returns the popup card or null.
 */
export declare function NotifyToast({ t, useStore, actions }: NotifyToastComponentProps): import("react").JSX.Element | null;
//# sourceMappingURL=NotifyToast.d.ts.map