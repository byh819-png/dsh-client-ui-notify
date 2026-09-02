import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Bottom-right notification popup, registered into the shell's `shell.overlay`
 * seat: shows the newest fired alert (answer complete / authorization needed)
 * as a transient card with the session label, holds, fades, then dismisses
 * itself; the close button hides it early. Rendered through a body portal so
 * a transformed or filtered ancestor cannot trap the fixed card, and the card
 * itself stays click-through (an announcement must never block the app
 * underneath — only the close button opts into pointer events).
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import css from './NotifyToast.module.css';
/** Full-opacity hold before the fade starts. Must agree with the stylesheet's
 * notify-toast-fade delay (NotifyToast.module.css) or the card unmounts
 * mid-fade. */
const HOLD_MS = 4000;
/** Fade duration. Must agree with the stylesheet's notify-toast-fade duration. */
const FADE_MS = 400;
/** One popup card: holds, fades, then reports done; keyed by toast seq. */
function NotifyToastView(props) {
    useEffect(() => {
        const timer = setTimeout(props.onDismiss, HOLD_MS + FADE_MS);
        return () => { clearTimeout(timer); };
    }, [props.onDismiss]);
    return createPortal(_jsxs("div", { className: css.toast, role: "status", "data-kind": props.kind, children: [_jsx("span", { className: css.text, children: props.text }), _jsx("button", { type: "button", className: css.close, "aria-label": props.closeLabel, onClick: props.onDismiss, children: _jsx("span", { "aria-hidden": true, children: "\u00D7" }) })] }), document.body);
}
/**
 * Render the current popup, or nothing while none is shown.
 * @param props - composed slot props.
 * @returns the popup card or null.
 */
export function NotifyToast({ t, useStore, actions }) {
    const toast = useStore(s => s.toast);
    if (toast === null)
        return null;
    const key = toast.kind === 'answer-complete'
        ? 'notify.toast.answerComplete'
        : 'notify.toast.authRequired';
    return (_jsx(NotifyToastView, { kind: toast.kind, text: t(key, { title: toast.title }), closeLabel: t('notify.toast.close'), onDismiss: actions.dismiss }, toast.seq));
}
//# sourceMappingURL=NotifyToast.js.map