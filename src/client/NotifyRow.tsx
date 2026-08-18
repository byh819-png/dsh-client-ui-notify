/**
 * Notification preference row registered into the General section item slot:
 * the master switch, the two event switches, the method selector, and the
 * method-specific inputs (TTS text / custom audio source + file picker), plus
 * a preview button that plays the current method immediately. Every control
 * writes one durable field through the injected `setField` face; the row never
 * touches the settings transport itself.
 */
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import {
  AUDIO_URL_PREFIX, MAX_AUDIO_BYTES, NOTIFY_FIELDS, audioExtensionOfMediaType,
  type NotifyMethod, type NotifySettings,
} from '../notify-settings.ts'
import type { NotifyKey } from './locales.ts'
import type { createNotifyRowStore } from './settings-store.ts'
import css from './NotifyRow.module.css'

/** Backwards-compatible alias for the shared audio size cap. */
export { MAX_AUDIO_BYTES as MAX_CUSTOM_AUDIO_BYTES } from '../notify-settings.ts'

/** Injected business face: the one-field write and the immediate preview. */
export interface NotifyRowInjected {
  /** Persist one notification setting field. */
  setField: <F extends keyof NotifySettings>(field: F, value: NotifySettings[F]) => void
  /** Play the currently configured method once. */
  preview: () => void
}

/** Full component props: runtime share + store share + locale seat + injected face. */
export type NotifyRowComponentProps =
  PropsRuntime<'settings.general.item'> & PropsStore<ReturnType<typeof createNotifyRowStore>>
  & PropsLocale<'settings.notify'> & NotifyRowInjected

/** Selectable alert methods in display order. */
const METHODS: readonly { value: NotifyMethod; labelKey: NotifyKey }[] = [
  { value: 'builtin', labelKey: 'notify.method.builtin' },
  { value: 'tts', labelKey: 'notify.method.tts' },
  { value: 'custom', labelKey: 'notify.method.custom' },
]

/** One labeled switch row (button chrome; the track/thumb draw the switch). */
function Switch(props: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      className={css.switch}
      aria-checked={props.checked}
      disabled={props.disabled}
      onClick={() => { props.onChange(!props.checked) }}
    >
      <span className={css.switchLabel}>{props.label}</span>
      <span className={css.switchTrack} data-on={props.checked || undefined} aria-hidden="true">
        <span className={css.switchThumb} />
      </span>
    </button>
  )
}

/**
 * Render the notification preference row.
 * @param props - composed slot props.
 * @returns the row element tree.
 */
export function NotifyRow({ t, useStore, setField, preview }: NotifyRowComponentProps) {
  const config = useStore(s => s.config)
  const active = config.enabled
  // One-shot feedback for the file picker: a message and whether it is an error.
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)

  /** Show a picker feedback message for a moment. */
  const flash = (text: string, error: boolean): void => {
    setNotice({ text, error })
    window.setTimeout(() => { setNotice(null) }, 4000)
  }

  /** Upload one picked audio file to the host route; the durable setting stores the served URL, never the bytes. */
  const pickFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (file === undefined) return
    if (file.size > MAX_AUDIO_BYTES) {
      flash(t('notify.fileTooLarge'), true)
      return
    }
    const extension = audioExtensionOfMediaType(file.type, file.name)
    if (extension === undefined) {
      flash(t('notify.fileTypeUnsupported'), true)
      return
    }
    try {
      const id = crypto.randomUUID()
      const url = `${AUDIO_URL_PREFIX}/${id}.${extension}`
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        // An empty file.type (some systems report none) uploads without the header; the host route infers from the extension.
        headers: file.type === '' ? {} : { 'content-type': file.type },
      })
      if (!response.ok) {
        flash(t('notify.uploadFailed'), true)
        return
      }
      // The previous file is ours to collect; a failed cleanup never blocks the switch.
      const previous = config.customAudioUrl
      if (previous.startsWith(`${AUDIO_URL_PREFIX}/`)) {
        void fetch(previous, { method: 'DELETE' }).catch(() => {})
      }
      setField(NOTIFY_FIELDS.customAudioUrl, url)
      flash(t('notify.uploaded'), false)
    } catch {
      flash(t('notify.uploadFailed'), true)
    }
  }

  return (
    <div className={css.group}>
      <div className={css.title}>{t('notify.title')}</div>
      <Switch
        label={t('notify.enabled')}
        checked={config.enabled}
        onChange={(next) => { setField(NOTIFY_FIELDS.enabled, next) }}
      />
      <div className={css.optionRow}>
        <Switch
          label={t('notify.onAnswerComplete')}
          checked={config.onAnswerComplete}
          disabled={!active}
          onChange={(next) => { setField(NOTIFY_FIELDS.onAnswerComplete, next) }}
        />
        <Switch
          label={t('notify.onAuthRequired')}
          checked={config.onAuthRequired}
          disabled={!active}
          onChange={(next) => { setField(NOTIFY_FIELDS.onAuthRequired, next) }}
        />
      </div>
      <div className={css.optionRow}>
        <label className={css.fieldLabel} htmlFor="ui-notify-method">{t('notify.method')}</label>
        <select
          id="ui-notify-method"
          className={css.select}
          value={config.method}
          disabled={!active}
          onChange={(event) => { setField(NOTIFY_FIELDS.method, event.target.value as NotifyMethod) }}
        >
          {METHODS.map(({ value, labelKey }) => (
            <option key={value} value={value}>{t(labelKey)}</option>
          ))}
        </select>
        <button type="button" className={css.preview} disabled={!active} onClick={preview}>
          {t('notify.preview')}
        </button>
      </div>
      {config.method === 'tts' && (
        <label className={css.fieldBlock}>
          <span className={css.fieldLabel}>{t('notify.ttsText')}</span>
          <input
            className={css.input}
            type="text"
            value={config.ttsText}
            placeholder={t('notify.ttsTextHint')}
            disabled={!active}
            onChange={(event) => { setField(NOTIFY_FIELDS.ttsText, event.target.value) }}
          />
        </label>
      )}
      {config.method === 'custom' && (
        <div className={css.fieldBlock}>
          <span className={css.fieldLabel}>{t('notify.customAudioUrl')}</span>
          <div className={css.customRow}>
            <input
              className={css.input}
              type="text"
              value={config.customAudioUrl}
              placeholder="https://… 或 data:audio/…"
              disabled={!active}
              onChange={(event) => { setField(NOTIFY_FIELDS.customAudioUrl, event.target.value) }}
            />
            <label className={css.pickFile}>
              {t('notify.pickFile')}
              <input
                type="file"
                accept="audio/*"
                hidden
                disabled={!active}
                onChange={(event) => { void pickFile(event) }}
              />
            </label>
          </div>
          <div className={css.hint}>{t('notify.customHint')}</div>
          {notice !== null && (
            <div className={notice.error ? css.noticeError : css.notice} role="status">
              {notice.text}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
