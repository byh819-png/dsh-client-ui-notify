import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Notification preference row registered into the General section item slot:
 * the master switch, the system-notification switch (with its permission
 * request), the two event switches, the sound-type selector, and the
 * method-specific inputs (TTS text / custom audio source + file picker), plus
 * a preview button that plays the current method immediately. Every control
 * writes one durable field through the injected `setField` face; the row
 * never touches the settings transport itself.
 */
import { useState } from 'react';
import { AUDIO_URL_PREFIX, MAX_AUDIO_BYTES, NOTIFY_FIELDS, audioExtensionOfMediaType, } from "../notify-settings.js";
import css from './NotifyRow.module.css';
/** Backwards-compatible alias for the shared audio size cap. */
export { MAX_AUDIO_BYTES as MAX_CUSTOM_AUDIO_BYTES } from "../notify-settings.js";
/** Selectable alert methods in display order. */
const METHODS = [
    { value: 'builtin', labelKey: 'notify.method.builtin' },
    { value: 'tts', labelKey: 'notify.method.tts' },
    { value: 'custom', labelKey: 'notify.method.custom' },
];
/** One labeled switch row (button chrome; the track/thumb draw the switch). */
function Switch(props) {
    return (_jsxs("button", { type: "button", role: "switch", className: css.switch, "aria-checked": props.checked, disabled: props.disabled, onClick: () => { props.onChange(!props.checked); }, children: [_jsx("span", { className: css.switchLabel, children: props.label }), _jsx("span", { className: css.switchTrack, "data-on": props.checked || undefined, "aria-hidden": "true", children: _jsx("span", { className: css.switchThumb }) })] }));
}
/**
 * Render the notification preference row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function NotifyRow({ t, useStore, setField, preview }) {
    const config = useStore(s => s.config);
    const active = config.enabled;
    // One-shot feedback for the file picker and the system-notification
    // permission flow: a message and whether it is an error.
    const [notice, setNotice] = useState(null);
    /** Show a picker feedback message for a moment. */
    const flash = (text, error) => {
        setNotice({ text, error });
        window.setTimeout(() => { setNotice(null); }, 4000);
    };
    /**
     * Toggle the system-notification channel. Enabling requests the browser
     * Notification permission first (the switch click is the required user
     * gesture) and persists the field only when permission lands on granted;
     * disabling never asks again.
     */
    const toggleSystem = (next) => {
        if (!next) {
            setField(NOTIFY_FIELDS.systemNotify, false);
            return;
        }
        if (typeof Notification === 'undefined') {
            flash(t('notify.system.unsupported'), true);
            return;
        }
        if (Notification.permission === 'denied') {
            flash(t('notify.system.denied'), true);
            return;
        }
        if (Notification.permission === 'default') {
            void Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    setField(NOTIFY_FIELDS.systemNotify, true);
                    flash(t('notify.system.granted'), false);
                }
                else {
                    flash(t('notify.system.denied'), true);
                }
            });
            return;
        }
        setField(NOTIFY_FIELDS.systemNotify, true);
    };
    /** Upload one picked audio file to the host route; the durable setting stores the served URL, never the bytes. */
    const pickFile = async (event) => {
        const file = event.target.files?.[0];
        if (file === undefined)
            return;
        if (file.size > MAX_AUDIO_BYTES) {
            flash(t('notify.fileTooLarge'), true);
            return;
        }
        const extension = audioExtensionOfMediaType(file.type, file.name);
        if (extension === undefined) {
            flash(t('notify.fileTypeUnsupported'), true);
            return;
        }
        try {
            const id = crypto.randomUUID();
            const url = `${AUDIO_URL_PREFIX}/${id}.${extension}`;
            const response = await fetch(url, {
                method: 'PUT',
                body: file,
                // An empty file.type (some systems report none) uploads without the header; the host route infers from the extension.
                headers: file.type === '' ? {} : { 'content-type': file.type },
            });
            if (!response.ok) {
                flash(t('notify.uploadFailed'), true);
                return;
            }
            // The previous file is ours to collect; a failed cleanup never blocks the switch.
            const previous = config.customAudioUrl;
            if (previous.startsWith(`${AUDIO_URL_PREFIX}/`)) {
                void fetch(previous, { method: 'DELETE' }).catch(() => { });
            }
            setField(NOTIFY_FIELDS.customAudioUrl, url);
            flash(t('notify.uploaded'), false);
        }
        catch {
            flash(t('notify.uploadFailed'), true);
        }
    };
    return (_jsxs("div", { className: css.group, children: [_jsx(Switch, { label: t('notify.enabled'), checked: config.enabled, onChange: (next) => { setField(NOTIFY_FIELDS.enabled, next); } }), _jsxs("div", { className: css.optionRow, children: [_jsx(Switch, { label: t('notify.onAnswerComplete'), checked: config.onAnswerComplete, disabled: !active, onChange: (next) => { setField(NOTIFY_FIELDS.onAnswerComplete, next); } }), _jsx(Switch, { label: t('notify.onAuthRequired'), checked: config.onAuthRequired, disabled: !active, onChange: (next) => { setField(NOTIFY_FIELDS.onAuthRequired, next); } })] }), _jsx(Switch, { label: t('notify.systemNotify'), checked: config.systemNotify, disabled: !active, onChange: toggleSystem }), _jsxs("div", { className: css.optionRow, children: [_jsx("label", { className: css.fieldLabel, htmlFor: "ui-notify-method", children: t('notify.method') }), _jsx("select", { id: "ui-notify-method", className: css.select, value: config.method, disabled: !active, onChange: (event) => { setField(NOTIFY_FIELDS.method, event.target.value); }, children: METHODS.map(({ value, labelKey }) => (_jsx("option", { value: value, children: t(labelKey) }, value))) }), _jsx("button", { type: "button", className: css.preview, disabled: !active, onClick: preview, children: t('notify.preview') })] }), config.method === 'tts' && (_jsxs("label", { className: css.fieldBlock, children: [_jsx("span", { className: css.fieldLabel, children: t('notify.ttsText') }), _jsx("input", { className: css.input, type: "text", value: config.ttsText, placeholder: t('notify.ttsTextHint'), disabled: !active, onChange: (event) => { setField(NOTIFY_FIELDS.ttsText, event.target.value); } })] })), config.method === 'custom' && (_jsxs("div", { className: css.fieldBlock, children: [_jsx("span", { className: css.fieldLabel, children: t('notify.customAudioUrl') }), _jsxs("div", { className: css.customRow, children: [_jsx("input", { className: css.input, type: "text", value: config.customAudioUrl, placeholder: "https://\u2026 \u6216 data:audio/\u2026", disabled: !active, onChange: (event) => { setField(NOTIFY_FIELDS.customAudioUrl, event.target.value); } }), _jsxs("label", { className: css.pickFile, children: [t('notify.pickFile'), _jsx("input", { type: "file", accept: "audio/*", hidden: true, disabled: !active, onChange: (event) => { void pickFile(event); } })] })] }), _jsx("div", { className: css.hint, children: t('notify.customHint') })] })), notice !== null && (_jsx("div", { className: notice.error ? css.noticeError : css.notice, role: "status", children: notice.text }))] }));
}
//# sourceMappingURL=NotifyRow.js.map