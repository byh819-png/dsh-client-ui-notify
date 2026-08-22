/**
 * Bottom-right notification popup, registered into the shell's `shell.overlay`
 * seat: shows the newest fired alert (answer complete / authorization needed)
 * as a transient card with the session label, holds, fades, then dismisses
 * itself; the close button hides it early. Rendered through a body portal so
 * a transformed or filtered ancestor cannot trap the fixed card, and the card
 * itself stays click-through (an announcement must never block the app
 * underneath — only the close button opts into pointer events).
 */
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the shell.overlay SlotMap declaration from the layout plugin.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { AlertKind } from './notify-runtime.ts'
import type { createNotifyToastStore } from './toast-store.ts'
import css from './NotifyToast.module.css'

/** Full-opacity hold before the fade starts. Must agree with the stylesheet's
 * notify-toast-fade delay (NotifyToast.module.css) or the card unmounts
 * mid-fade. */
const HOLD_MS = 4000
/** Fade duration. Must agree with the stylesheet's notify-toast-fade duration. */
const FADE_MS = 400

/** Full composed props: runtime share + store share + locale seat. */
export type NotifyToastComponentProps =
  PropsRuntime<'shell.overlay'> & PropsStore<ReturnType<typeof createNotifyToastStore>>
  & PropsLocale<'settings.notify'>

/** One popup card: holds, fades, then reports done; keyed by toast seq. */
function NotifyToastView(props: { text: string; closeLabel: string; kind: AlertKind; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(props.onDismiss, HOLD_MS + FADE_MS)
    return () => { clearTimeout(timer) }
  }, [props.onDismiss])
  return createPortal(
    <div className={css.toast} role="status" data-kind={props.kind}>
      <span className={css.text}>{props.text}</span>
      <button type="button" className={css.close} aria-label={props.closeLabel} onClick={props.onDismiss}>
        <span aria-hidden>×</span>
      </button>
    </div>,
    document.body,
  )
}

/**
 * Render the current popup, or nothing while none is shown.
 * @param props - composed slot props.
 * @returns the popup card or null.
 */
export function NotifyToast({ t, useStore, actions }: NotifyToastComponentProps) {
  const toast = useStore(s => s.toast)
  if (toast === null) return null
  const key = toast.kind === 'answer-complete'
    ? ('notify.toast.answerComplete' as const)
    : ('notify.toast.authRequired' as const)
  return (
    <NotifyToastView
      key={toast.seq}
      kind={toast.kind}
      text={t(key, { title: toast.title })}
      closeLabel={t('notify.toast.close')}
      onDismiss={actions.dismiss}
    />
  )
}
