// @vitest-environment jsdom
/** NotifyRow behavior: switches, method selector, conditional inputs, file
 * picker, and preview — every control drives the injected setField/preview. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore, type SessionListState, type WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { DEFAULT_NOTIFY_SETTINGS, type NotifySettings } from '../src/notify-settings.ts'
import { NotifyRow, MAX_CUSTOM_AUDIO_BYTES } from '../src/client/NotifyRow.tsx'
import type { NotifyRowComponentProps } from '../src/client/NotifyRow.tsx'
import { createNotifyRowStore } from '../src/client/settings-store.ts'

afterEach(cleanup)

const COPY: Record<string, string> = {
  'notify.enabled': 'Enable alerts',
  'notify.systemNotify': 'System notification',
  'notify.system.answerComplete': 'Answer complete',
  'notify.system.authRequired': 'Authorization needed',
  'notify.system.granted': 'System notifications enabled',
  'notify.system.denied': 'System notification permission denied',
  'notify.system.unsupported': 'This browser does not support system notifications',
  'notify.onAnswerComplete': 'Alert when an answer completes',
  'notify.onAuthRequired': 'Alert when authorization is needed',
  'notify.method': 'Sound type',
  'notify.method.builtin': 'Built-in ringtone',
  'notify.method.tts': 'Text to speech',
  'notify.method.custom': 'Custom audio',
  'notify.ttsText': 'Text to speak',
  'notify.ttsTextHint': 'Spoken aloud when an alert fires',
  'notify.customAudioUrl': 'Audio source',
  'notify.customHint': 'An http(s) link, or a local audio file (≤ 1MB)',
  'notify.pickFile': 'Choose file',
  'notify.preview': 'Preview',
  'notify.toast.answerComplete': 'Answer complete: {title}',
  'notify.toast.authRequired': 'Authorization needed: {title}',
  'notify.toast.close': 'Dismiss',
  'notify.uploaded': 'Audio saved',
  'notify.fileTooLarge': 'The audio file must be 1MB or smaller',
  'notify.fileTypeUnsupported': 'Unsupported audio format',
  'notify.uploadFailed': 'Upload failed, please retry',
}

/** Empty global standard-kit hooks (the row reads neither). */
function emptySessions() {
  const store = createSnapshotStore<SessionListState>(
    { ids: [], byId: {}, current: undefined, phase: 'ready', subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined })
  return bindSnapshotSelector(store)
}
function emptyWorkspaces() {
  const store = createSnapshotStore<WorkspaceListState>({
    items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', error: null,
    baselinesReady: true, recentWorkspaceId: undefined,
  })
  return bindSnapshotSelector(store)
}

function mount(config: Partial<NotifySettings> = {}) {
  const store = createNotifyRowStore().create()
  store.actions.sync({ ...DEFAULT_NOTIFY_SETTINGS, ...config }, 0)
  const setField = vi.fn()
  const preview = vi.fn()
  const props: NotifyRowComponentProps = {
    useSessions: emptySessions(),
    useWorkspaces: emptyWorkspaces(),
    useStore: bindSnapshotSelector(store),
    actions: store.actions,
    t: (key: string) => COPY[key] ?? key,
    setField,
    preview,
  }
  render(<NotifyRow {...props} />)
  return { store, setField, preview }
}

const switchOf = (name: RegExp): HTMLButtonElement =>
  screen.getByRole('switch', { name })

describe('NotifyRow', () => {
  it('renders the master switch, the event switches, and the system switch', () => {
    mount()
    expect(screen.queryByText('Sound alerts')).toBeNull()
    expect(screen.queryByText('Show popup')).toBeNull()
    expect(switchOf(/Enable alerts/).getAttribute('aria-checked')).toBe('false')
    expect(switchOf(/Alert when an answer completes/).getAttribute('aria-checked')).toBe('true')
    expect(switchOf(/Alert when authorization is needed/).getAttribute('aria-checked')).toBe('true')
    expect(switchOf(/System notification/).getAttribute('aria-checked')).toBe('false')
  })

  it('routes switch clicks through setField and mirrors store syncs', () => {
    const b = mount()
    fireEvent.click(switchOf(/Enable alerts/))
    expect(b.setField).toHaveBeenCalledWith('enabled', true)
    // No store write yet: the switch stays off until the mirror lands.
    expect(switchOf(/Enable alerts/).getAttribute('aria-checked')).toBe('false')
    act(() => { b.store.actions.sync({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true }, 1) })
    expect(switchOf(/Enable alerts/).getAttribute('aria-checked')).toBe('true')

    fireEvent.click(switchOf(/Alert when an answer completes/))
    expect(b.setField).toHaveBeenCalledWith('onAnswerComplete', false)
    fireEvent.click(switchOf(/Alert when authorization is needed/))
    expect(b.setField).toHaveBeenCalledWith('onAuthRequired', false)
  })

  it('ignores stale mirror syncs', () => {
    const b = mount()
    act(() => { b.store.actions.sync({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true }, 0) })
    expect(switchOf(/Enable alerts/).getAttribute('aria-checked')).toBe('false')
  })

  it('enables the system switch only when permission is already granted', () => {
    const b = mount({ enabled: true })
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'granted'
    vi.stubGlobal('Notification', NotificationMock)
    try {
      fireEvent.click(switchOf(/System notification/))
      expect(b.setField).toHaveBeenCalledWith('systemNotify', true)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('requests permission on the switch click and persists only when granted', async () => {
    const b = mount({ enabled: true })
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'default'
    NotificationMock.requestPermission = vi.fn(() => Promise.resolve('granted' as NotificationPermission))
    vi.stubGlobal('Notification', NotificationMock)
    try {
      fireEvent.click(switchOf(/System notification/))
      expect(NotificationMock.requestPermission).toHaveBeenCalledTimes(1)
      await act(async () => { await Promise.resolve() })
      expect(b.setField).toHaveBeenCalledWith('systemNotify', true)
      expect(screen.getByText('System notifications enabled')).toBeDefined()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('refuses to persist when permission is denied', () => {
    const b = mount({ enabled: true })
    const deniedMock = vi.fn()
    deniedMock.permission = 'denied'
    vi.stubGlobal('Notification', deniedMock)
    try {
      fireEvent.click(switchOf(/System notification/))
      expect(b.setField).not.toHaveBeenCalled()
      expect(screen.getByText('System notification permission denied')).toBeDefined()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('refuses to persist when the browser lacks Notification support', () => {
    const b = mount({ enabled: true })
    vi.stubGlobal('Notification', undefined)
    try {
      fireEvent.click(switchOf(/System notification/))
      expect(b.setField).not.toHaveBeenCalled()
      expect(screen.getByText('This browser does not support system notifications')).toBeDefined()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('disables the event switches, the system switch, and the selector while the master switch is off', () => {
    mount({ enabled: false })
    expect(switchOf(/Alert when an answer completes/).disabled).toBe(true)
    expect(switchOf(/Alert when authorization is needed/).disabled).toBe(true)
    expect(switchOf(/System notification/).disabled).toBe(true)
    expect(screen.getByRole<HTMLSelectElement>('combobox').disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Preview' }).disabled).toBe(true)
  })

  it('switches the method through the selector and renders the TTS input', () => {
    const b = mount({ enabled: true, method: 'tts', ttsText: '你好' })
    const select = screen.getByRole<HTMLSelectElement>('combobox')
    expect(select.value).toBe('tts')
    const input = screen.getByDisplayValue('你好')
    fireEvent.change(input, { target: { value: '完成了' } })
    expect(b.setField).toHaveBeenCalledWith('ttsText', '完成了')
    fireEvent.change(select, { target: { value: 'builtin' } })
    expect(b.setField).toHaveBeenCalledWith('method', 'builtin')
  })

  it('renders the custom audio source input, file picker, and hint', () => {
    const b = mount({ enabled: true, method: 'custom', customAudioUrl: 'https://x/a.wav' })
    expect(screen.getByText(/An http\(s\) link/)).toBeDefined()
    const input = screen.getByDisplayValue('https://x/a.wav')
    fireEvent.change(input, { target: { value: 'https://y/b.wav' } })
    expect(b.setField).toHaveBeenCalledWith('customAudioUrl', 'https://y/b.wav')
    expect(screen.getByText('Choose file')).toBeDefined()
  })

  it('ignores an oversized or absent custom file without writing', () => {
    const b = mount({ enabled: true, method: 'custom' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      fireEvent.change(fileInput, { target: { files: [] } })
      expect(b.setField).not.toHaveBeenCalled()
      const file = new File([new Uint8Array(MAX_CUSTOM_AUDIO_BYTES + 1)], 'big.wav', { type: 'audio/wav' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      expect(b.setField).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('uploads a chosen local file to the host route and stores its URL', async () => {
    const b = mount({ enabled: true, method: 'custom' })
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('crypto', { randomUUID: () => '01234567-89ab-4cde-8f01-23456789abcd' })
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['RIFF'], 'ring.wav', { type: 'audio/wav' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/_dsh-ui-notify/audio/01234567-89ab-4cde-8f01-23456789abcd.wav',
          expect.objectContaining({ method: 'PUT', body: file }),
        )
        expect(b.setField).toHaveBeenCalledWith(
          'customAudioUrl',
          '/_dsh-ui-notify/audio/01234567-89ab-4cde-8f01-23456789abcd.wav',
        )
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('deletes the previous hosted file when replacing it', async () => {
    const previous = '/_dsh-ui-notify/audio/00000000-0000-4000-8000-000000000000.wav'
    mount({ enabled: true, method: 'custom', customAudioUrl: previous })
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('crypto', { randomUUID: () => '11111111-1111-4111-8111-111111111111' })
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['RIFF'], 'ring.wav', { type: 'audio/wav' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(previous, { method: 'DELETE' })
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('ignores a file whose declared type is not audio', async () => {
    const b = mount({ enabled: true, method: 'custom' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['x'], 'a.txt', { type: 'text/plain' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await Promise.resolve()
      expect(fetchMock).not.toHaveBeenCalled()
      expect(b.setField).not.toHaveBeenCalled()
      expect(screen.getByText('Unsupported audio format')).toBeDefined()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('falls back to the file name when the browser reports no type', async () => {
    const b = mount({ enabled: true, method: 'custom' })
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('crypto', { randomUUID: () => '66666666-6666-4666-8666-666666666666' })
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['RIFF'], 'song.mp3', { type: '' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/_dsh-ui-notify/audio/66666666-6666-4666-8666-666666666666.mp3',
          expect.objectContaining({ method: 'PUT' }),
        )
        expect(b.setField).toHaveBeenCalledWith(
          'customAudioUrl',
          '/_dsh-ui-notify/audio/66666666-6666-4666-8666-666666666666.mp3',
        )
      })
      // 空类型上传不带 content-type 头（宿主按扩展名推断）
      expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: {} })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('shows success and failure feedback around the upload', async () => {
    vi.useFakeTimers()
    try {
      const success = mount({ enabled: true, method: 'custom' })
      const okFetch = vi.fn(() => Promise.resolve({ ok: true }))
      vi.stubGlobal('fetch', okFetch)
      vi.stubGlobal('crypto', { randomUUID: () => '77777777-7777-4777-8777-777777777777' })
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      fireEvent.change(fileInput, { target: { files: [new File(['RIFF'], 'a.wav', { type: 'audio/wav' })] } })
      await act(async () => { await Promise.resolve() })
      await act(async () => { await Promise.resolve() })
      expect(screen.getByText('Audio saved')).toBeDefined()
      expect(success.setField).toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(4000) })
      expect(screen.queryByText('Audio saved')).toBeNull()

      const failed = mount({ enabled: true, method: 'custom' })
      const badFetch = vi.fn(() => Promise.resolve({ ok: false, status: 500 }))
      vi.stubGlobal('fetch', badFetch)
      vi.stubGlobal('crypto', { randomUUID: () => '88888888-8888-4888-8888-888888888888' })
      fireEvent.change(fileInput, { target: { files: [new File(['RIFF'], 'a.wav', { type: 'audio/wav' })] } })
      await act(async () => { await Promise.resolve() })
      await act(async () => { await Promise.resolve() })
      expect(screen.getByText('Upload failed, please retry')).toBeDefined()
      expect(failed.setField).not.toHaveBeenCalled()
      act(() => { vi.advanceTimersByTime(4000) })
      expect(screen.queryByText('Upload failed, please retry')).toBeNull()
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('keeps the previous value when the upload fails', async () => {
    const b = mount({ enabled: true, method: 'custom' })
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    vi.stubGlobal('crypto', { randomUUID: () => '22222222-2222-4222-8222-222222222222' })
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['RIFF'], 'ring.wav', { type: 'audio/wav' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await Promise.resolve()
      expect(b.setField).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('keeps the previous value when the host refuses the upload', async () => {
    const b = mount({ enabled: true, method: 'custom' })
    const fetchMock = vi.fn(() => Promise.resolve({ ok: false, status: 415 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('crypto', { randomUUID: () => '33333333-3333-4333-8333-333333333333' })
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['RIFF'], 'ring.wav', { type: 'audio/wav' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await Promise.resolve()
      expect(b.setField).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('ignores a failed cleanup of the previous hosted file', async () => {
    const previous = '/_dsh-ui-notify/audio/44444444-4444-4444-8444-444444444444.wav'
    mount({ enabled: true, method: 'custom', customAudioUrl: previous })
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return Promise.reject(new Error('gone'))
      return Promise.resolve({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('crypto', { randomUUID: () => '55555555-5555-4555-8555-555555555555' })
    try {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!
      const file = new File(['RIFF'], 'ring.wav', { type: 'audio/wav' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/_dsh-ui-notify/audio/55555555-5555-4555-8555-555555555555.wav',
          expect.objectContaining({ method: 'PUT' }),
        )
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('preview plays the current method through the injected face', () => {
    const b = mount({ enabled: true })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(b.preview).toHaveBeenCalledTimes(1)
  })
})
