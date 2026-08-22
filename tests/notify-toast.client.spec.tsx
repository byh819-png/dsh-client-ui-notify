// @vitest-environment jsdom
/** NotifyToast behavior: nothing until an alert, localized copy per kind,
 * newest-alert-wins replacement, timed auto-dismiss, and early close. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore, type SessionId, type SessionListState, type WorkspaceListState } from '@deepseek-ai/dsh-client-runtime/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-test-runtime'
import { NotifyToast, type NotifyToastComponentProps } from '../src/client/NotifyToast.tsx'
import { createNotifyToastStore, type NotifyToastItem } from '../src/client/toast-store.ts'

afterEach(cleanup)

const COPY: Record<string, string> = {
  'notify.toast.answerComplete': 'Answer complete: {title}',
  'notify.toast.authRequired': 'Authorization needed: {title}',
  'notify.toast.close': 'Dismiss',
}

/** Same {name} interpolation as the locale service's translate. */
function translate(key: string, params?: Record<string, unknown>): string {
  const template = COPY[key] ?? key
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params?.[name]
    return typeof value === 'string' ? value : match
  })
}

/** Empty global standard-kit hooks (the popup reads neither). */
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

function mount() {
  const store = createNotifyToastStore().create()
  const props: NotifyToastComponentProps = {
    useSessions: emptySessions(),
    useWorkspaces: emptyWorkspaces(),
    useStore: bindSnapshotSelector(store),
    actions: store.actions,
    t: translate,
  }
  render(<NotifyToast {...props} />)
  return { store }
}

const SID = 'sess-1' as SessionId

function toast(kind: NotifyToastItem['kind'], title: string, seq = 1): NotifyToastItem {
  return { seq, kind, sessionId: SID, title }
}

const shown = (): Element | null => document.body.querySelector('[role="status"]')

describe('NotifyToast', () => {
  it('renders nothing while no alert has fired', () => {
    mount()
    expect(shown()).toBeNull()
  })

  it('shows the localized copy for both alert kinds, replacing the previous toast', () => {
    const { store } = mount()
    act(() => { store.actions.show(toast('answer-complete', 'Alpha')) })
    expect(screen.getByRole('status').textContent).toContain('Answer complete: Alpha')
    act(() => { store.actions.show(toast('auth-required', 'Beta', 2)) })
    expect(screen.getByRole('status').textContent).toContain('Authorization needed: Beta')
  })

  it('restarts the hold when a newer alert replaces the current one', () => {
    vi.useFakeTimers()
    try {
      const { store } = mount()
      act(() => { store.actions.show(toast('answer-complete', 'Alpha')) })
      act(() => { vi.advanceTimersByTime(1000) })
      act(() => { store.actions.show(toast('auth-required', 'Beta', 2)) })
      // 4000ms after the SECOND show: the first hold was abandoned with its view.
      act(() => { vi.advanceTimersByTime(4000) })
      expect(screen.getByRole('status').textContent).toContain('Authorization needed: Beta')
      act(() => { vi.advanceTimersByTime(400) })
      expect(shown()).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('auto-dismisses after the hold and fade', () => {
    vi.useFakeTimers()
    try {
      const { store } = mount()
      act(() => { store.actions.show(toast('answer-complete', 'Alpha')) })
      act(() => { vi.advanceTimersByTime(4399) })
      expect(shown()).not.toBeNull()
      act(() => { vi.advanceTimersByTime(1) })
      expect(shown()).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes immediately through the dismiss button', () => {
    const { store } = mount()
    act(() => { store.actions.show(toast('answer-complete', 'Alpha')) })
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(shown()).toBeNull()
  })
})
