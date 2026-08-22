/** ui-notify apply wiring: settings dictionaries riding the locale service,
 * declaration-aware row registration, config projection into the row store,
 * field writes routed through the runtime to the settings transport, and
 * HMR collapse recovery. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SessionId, type SessionListState, type SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { TestRemote, usePinnedBrowserLanguages } from '@deepseek-ai/dsh-client-test-runtime'
import { SettingsScopeBinder } from '@deepseek-ai/dsh-client-ui-settings/client'
import { apply, inject, SETTINGS_NS } from '@deepseek-ai/dsh-client-ui-notify/client'
import type { NotifyRowInjected } from '@deepseek-ai/dsh-client-ui-notify/client'
import { DEFAULT_NOTIFY_SETTINGS, NOTIFY_SETTINGS_NAMESPACE, NotifySettingsSchema } from '../src/notify-settings.ts'
import { NotifyRow } from '../src/client/NotifyRow.tsx'
import type { createNotifyRowStore } from '../src/client/settings-store.ts'
import { NotifyToast } from '../src/client/NotifyToast.tsx'
import type { createNotifyToastStore } from '../src/client/toast-store.ts'
import { SYSTEM_NOTIFICATION_TAG } from '../src/client/system-notify.ts'

// The row's copy rides the browser locale; these specs assert the shipped
// Chinese copy, so they state the browser they assume.
usePinnedBrowserLanguages('zh-CN')

const SLOT = 'settings.general.item'

async function bench(isLoopback = true) {
  const ctx = new Context()
  await ctx.plugin(SlotRegistry).await()
  const locale = new LocaleRuntime(ctx)
  ctx.provide('locale', locale)
  let section = { ...DEFAULT_NOTIFY_SETTINGS }
  const namespace = () => ({
    ns: NOTIFY_SETTINGS_NAMESPACE,
    schema: NotifySettingsSchema.toJSON(),
    value: section,
    applies: 'live' as const,
    secrets: [],
    revision: 0,
  })
  const describe = vi.fn(() => Promise.resolve({
    rpcId: 'notify-describe' as never,
    result: {
      ok: true as const,
      value: { writable: true, hasDocument: true, namespaces: [namespace()] },
    },
  }))
  const mutate = vi.fn((request: { ops: { op: string; path: string[]; value?: unknown }[] }) => {
    for (const op of request.ops) {
      if (op.op === 'set' && op.path[0] !== undefined) {
        section = { ...section, [op.path[0]]: op.value }
      }
    }
    return Promise.resolve({
      rpcId: 'notify-mutate' as never,
      result: { ok: true as const, value: namespace() },
    })
  })
  ctx.provide('connection', { api: { settings: { describe, mutate } }, isLoopback } as never)
  // The settings transport and the forwarded-event port the plugin injects.
  new TestRemote(ctx)
  await ctx.plugin(SettingsScopeBinder).await()
  const sessionsList = createSnapshotStore<SessionListState>({
    ids: [], byId: {}, current: undefined, phase: 'ready',
    subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined,
  })
  ctx.provide('sessions', { list: sessionsList } as never)
  return {
    ctx, slots: ctx.get('slots') as SlotRegistry, locale, describe, mutate, sessionsList,
    setHostSection: (next: typeof section) => { section = next },
  }
}

/** Stand in for the shell: declare the General item slot and the floating
 * overlay seat from root. */
function declareItems(slots: SlotRegistry): () => void {
  return slots.register(
    {
      name: 'root',
      children: {
        [SLOT]: { kind: 'list', scope: 'root' },
        'shell.overlay': { kind: 'list', scope: 'root' },
      },
    } as never,
    () => null,
  )
}

/** Mirror the framework's inject choreography: bake a real instance from the
 * declared handle and hand its actions to the entry's inject factory. */
function faceOf(slots: SlotRegistry) {
  const entry = slots.entries(SLOT).find(e => e.component === NotifyRow)!
  const handle = entry.store as ReturnType<typeof createNotifyRowStore>
  const instance = handle.create()
  const face = (entry.inject as unknown as (a: typeof instance.actions) => NotifyRowInjected)(instance.actions)
  return { entry, instance, face }
}

/** Same choreography for the popup entry registered into shell.overlay. */
function toastFaceOf(slots: SlotRegistry) {
  const entry = slots.entries('shell.overlay').find(e => e.component === NotifyToast)!
  const handle = entry.store as ReturnType<typeof createNotifyToastStore>
  const instance = handle.create()
  const face = (entry.inject as unknown as (a: typeof instance.actions) => Record<string, never>)(instance.actions)
  return { entry, instance, face }
}

function summary(patch: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: 'sess-1' as SessionId,
    displayTitle: 'sess-1',
    running: false,
    blank: false,
    updatedAt: 1,
    ...patch,
  }
}

function listState(summaries: SessionSummary[]): SessionListState {
  const byId: Record<SessionId, SessionSummary> = {}
  for (const s of summaries) byId[s.id] = s
  return {
    ids: summaries.map(s => s.id),
    byId,
    current: undefined,
    phase: 'ready',
    subagentsByParent: {},
    jobsBySession: {},
    currentAddress: undefined,
  }
}

describe('ui-notify apply', () => {
  it('declares the slot and locale services', () => {
    expect(inject).toEqual(['slots', 'locale', 'connection', 'remote', 'settingsScope', 'sessions'])
  })

  it('registers localized copy and the row (declaration before or after apply)', async () => {
    const before = await bench()
    declareItems(before.slots)
    await before.ctx.plugin({ inject: [...inject], apply }).await()
    expect(before.locale.bind(SETTINGS_NS)('notify.enabled')).toBe('启用提醒')
    before.locale.setLocale('en')
    expect(before.locale.bind(SETTINGS_NS)('notify.enabled')).toBe('Enable alerts')
    const entry = before.slots.entries(SLOT).find(e => e.component === NotifyRow)!
    expect(entry.options).toMatchObject({ id: 'notify', order: 20 })
    expect(entry.locale).toBe(SETTINGS_NS)

    const after = await bench()
    const fiber = after.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(after.slots.entries(SLOT)).toHaveLength(0)
    declareItems(after.slots)
    await Promise.resolve()
    expect(after.slots.entries(SLOT).some(e => e.component === NotifyRow)).toBe(true)
  })

  it('projects the loaded config into the row store and routes face writes back', async () => {
    const b = await bench()
    b.setHostSection({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'tts' })
    declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const { instance, face } = faceOf(b.slots)
    // The scope read landed and the mirror follows it.
    await vi.waitFor(() => { expect(instance.getSnapshot().config.method).toBe('tts') })

    face.setField('enabled', true)
    expect(instance.getSnapshot().config.enabled).toBe(true)
    face.setField('method', 'custom')
    expect(instance.getSnapshot().config.method).toBe('custom')
    // The preview face routes straight into the runtime (browser engine no-ops
    // under jsdom; the dispatch path is pinned by the runtime spec).
    expect(() => { face.preview() }).not.toThrow()
    await vi.waitFor(() => {
      const writes = b.mutate.mock.calls.flatMap(call => call[0].ops)
      expect(writes.some(op => op.path[0] === 'method' && op.value === 'custom')).toBe(true)
    })
    // The row's copy rides the standard locale seat.
    expect(b.slots.entries(SLOT).find(e => e.component === NotifyRow)!.locale).toBe(SETTINGS_NS)
  })

  it('registers the popup into shell.overlay and routes fired edges into its store', async () => {
    const b = await bench()
    b.setHostSection({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true })
    declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const { entry, instance } = toastFaceOf(b.slots)
    expect(entry.options).toMatchObject({ id: 'notify', order: 30 })
    expect(entry.locale).toBe(SETTINGS_NS)
    expect(instance.getSnapshot().toast).toBeNull()

    // An answer-complete edge: the sound plays (browser engine no-ops under
    // this environment) and the popup store shows the alert.
    b.sessionsList.set(listState([summary({ running: true })]))
    b.sessionsList.set(listState([summary({ running: false, updatedAt: 2 })]))
    expect(instance.getSnapshot().toast).toEqual({
      seq: 1, kind: 'answer-complete', sessionId: 'sess-1', title: 'sess-1',
    })

    // An authorization-needed edge replaces the toast (newest wins).
    b.sessionsList.set(listState([summary({ pendingInteraction: 'approval', updatedAt: 3 })]))
    expect(instance.getSnapshot().toast).toEqual({
      seq: 2, kind: 'auth-required', sessionId: 'sess-1', title: 'sess-1',
    })
  })

  it('sends a browser system notification on edges when the system toggle is on', async () => {
    const b = await bench()
    b.setHostSection({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, systemNotify: true })
    declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'granted'
    vi.stubGlobal('Notification', NotificationMock)
    try {
      b.sessionsList.set(listState([summary({ running: true })]))
      b.sessionsList.set(listState([summary({ running: false, updatedAt: 2 })]))
      expect(NotificationMock).toHaveBeenCalledWith('回答已完成', { body: 'sess-1', tag: SYSTEM_NOTIFICATION_TAG })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('refreshes its namespace on invalidation and keeps remote browsers process-local', async () => {
    const b = await bench()
    declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    const { instance } = faceOf(b.slots)
    await vi.waitFor(() => { expect(b.describe).toHaveBeenCalled() })
    b.ctx.remote.$dispatch('settings/document-updated', ['unrelated', 0])
    expect(b.describe).toHaveBeenCalledTimes(1)
    b.setHostSection({ ...DEFAULT_NOTIFY_SETTINGS, method: 'custom', customAudioUrl: 'https://x/a.wav' })
    b.ctx.remote.$dispatch('settings/document-updated', [NOTIFY_SETTINGS_NAMESPACE, 0])
    await vi.waitFor(() => { expect(instance.getSnapshot().config.customAudioUrl).toBe('https://x/a.wav') })

    const remote = await bench(false)
    declareItems(remote.slots)
    await remote.ctx.plugin({ inject: [...inject], apply }).await()
    const { face: remoteFace } = faceOf(remote.slots)
    remoteFace.setField('enabled', true)
    await Promise.resolve()
    expect(remote.describe).not.toHaveBeenCalled()
    expect(remote.mutate).not.toHaveBeenCalled()
  })

  it('activates before a slow initial settings read and converges when it settles', async () => {
    const b = await bench()
    b.setHostSection({ ...DEFAULT_NOTIFY_SETTINGS, method: 'custom' })
    declareItems(b.slots)
    const describe = b.describe.getMockImplementation()!
    let resolveDescribe!: (value: Awaited<ReturnType<typeof describe>>) => void
    const pending = new Promise<Awaited<ReturnType<typeof describe>>>((done) => { resolveDescribe = done })
    b.describe.mockImplementationOnce(() => pending)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const { instance } = faceOf(b.slots)
    expect(instance.getSnapshot().config.method).toBe('builtin')
    resolveDescribe(await describe())
    await vi.waitFor(() => { expect(instance.getSnapshot().config.method).toBe('custom') })
    await fiber.dispose()
  })

  it('recovers after an HMR collapse of the declaring entry (stale disposer must not block)', async () => {
    const b = await bench()
    const host = declareItems(b.slots)
    await b.ctx.plugin({ inject: [...inject], apply }).await()
    expect(b.slots.entries(SLOT)).toHaveLength(1)

    // Collapse: the declarer dies, the cascade removes our entry while the
    // apply closure still holds its (now stale) disposer.
    host()
    expect(b.slots.entries(SLOT)).toHaveLength(0)

    declareItems(b.slots)
    await Promise.resolve()
    expect(b.slots.entries(SLOT).some(e => e.component === NotifyRow)).toBe(true)
  })

  it('teardown removes the row, the popup, and the dictionaries; teardown without a declaration is quiet', async () => {
    const b = await bench()
    declareItems(b.slots)
    const fiber = b.ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(b.slots.entries(SLOT)).toHaveLength(1)
    expect(b.slots.entries('shell.overlay')).toHaveLength(1)
    await fiber.dispose()
    expect(b.slots.entries(SLOT)).toHaveLength(0)
    expect(b.slots.entries('shell.overlay')).toHaveLength(0)
    // Dictionary disposal: translation falls back to the bare key.
    expect(b.locale.bind(SETTINGS_NS)('notify.enabled')).toBe('notify.enabled')

    const quiet = await bench()
    const f2 = quiet.ctx.plugin({ inject: [...inject], apply })
    await f2.await()
    await f2.dispose()
    expect(quiet.slots.entries(SLOT)).toHaveLength(0)
    expect(quiet.slots.entries('shell.overlay')).toHaveLength(0)
  })
})
