/** NotifyRuntime behavior: settings adoption, session-edge observation
 * (answer-complete and authorization-needed), baseline/rebaseline semantics,
 * field writes, preview, and config-event publication. */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { createSnapshotStore, type SessionId, type SessionListState, type SessionSummary } from '@deepseek-ai/dsh-client-runtime/client'
import { DEFAULT_NOTIFY_SETTINGS, type NotifySettings } from '../src/notify-settings.ts'
import { NotifyRuntime } from '../src/client/notify-runtime.ts'

const SID = 'sess-1' as SessionId

function summary(patch: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: SID,
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

interface Bench {
  ctx: Context
  list: ReturnType<typeof createSnapshotStore<SessionListState>>
  engine: { playBuiltin: ReturnType<typeof vi.fn>; playTts: ReturnType<typeof vi.fn>; playCustom: ReturnType<typeof vi.fn> }
  runtime: NotifyRuntime
  hostSet: ReturnType<typeof vi.fn>
  publishHost(value: NotifySettings | undefined): void
}

function bench(initialHost?: NotifySettings): Bench {
  const ctx = new Context()
  let value: NotifySettings | undefined = initialHost === undefined ? undefined : { ...initialHost }
  const listeners = new Set<() => void>()
  const hostSet = vi.fn((field: string, next: unknown) => {
    value = { ...(value ?? DEFAULT_NOTIFY_SETTINGS), [field]: next }
    for (const listener of [...listeners]) listener()
    return Promise.resolve()
  })
  const host = {
    getSnapshot: () => ({
      status: 'ready' as const, value, base: undefined, user: undefined,
      revision: 0, writable: true, mode: 'host' as const,
    }),
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    set: hostSet,
    unset: vi.fn(),
  }
  const list = createSnapshotStore<SessionListState>(listState([]))
  ctx.provide('sessions', { list } as never)
  const engine = { playBuiltin: vi.fn(), playTts: vi.fn(), playCustom: vi.fn() }
  const runtime = new NotifyRuntime(ctx, host, engine)
  return {
    ctx, list, engine, runtime, hostSet,
    publishHost(next) {
      value = next === undefined ? undefined : { ...next }
      for (const listener of [...listeners]) listener()
    },
  }
}

describe('NotifyRuntime', () => {
  it('records the first list snapshot without ringing (sessions already idle at load ring nothing)', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true })
    b.list.set(listState([summary({ running: false })]))
    b.list.set(listState([summary({ running: false, updatedAt: 2 })]))
    expect(b.engine.playBuiltin).not.toHaveBeenCalled()
  })

  it('rings on the running → idle edge with the built-in method', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true })
    b.list.set(listState([summary({ running: true })]))
    b.list.set(listState([summary({ running: false, updatedAt: 2 })]))
    expect(b.engine.playBuiltin).toHaveBeenCalledTimes(1)
  })

  it('rings on the pending-appears edge with the custom method and its URL', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'custom', customAudioUrl: 'https://x/a.wav' })
    b.list.set(listState([summary()]))
    b.list.set(listState([summary({ pendingInteraction: 'approval', updatedAt: 2 })]))
    expect(b.engine.playCustom).toHaveBeenCalledWith('https://x/a.wav')
  })

  it('speaks the configured text on the TTS method', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'tts', ttsText: '回答完成' })
    b.list.set(listState([summary({ running: true })]))
    b.list.set(listState([summary({ running: false, updatedAt: 2 })]))
    expect(b.engine.playTts).toHaveBeenCalledWith('回答完成')
  })

  it('respects the master switch and each event toggle', () => {
    const disabled = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: false })
    disabled.list.set(listState([summary({ running: true })]))
    disabled.list.set(listState([summary({ running: false, updatedAt: 2 })]))
    expect(disabled.engine.playBuiltin).not.toHaveBeenCalled()

    const noComplete = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, onAnswerComplete: false })
    noComplete.list.set(listState([summary({ running: true })]))
    noComplete.list.set(listState([summary({ running: false, updatedAt: 2 })]))
    expect(noComplete.engine.playBuiltin).not.toHaveBeenCalled()

    const noAuth = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, onAuthRequired: false })
    noAuth.list.set(listState([summary()]))
    noAuth.list.set(listState([summary({ pendingInteraction: 'question', updatedAt: 2 })]))
    expect(noAuth.engine.playBuiltin).not.toHaveBeenCalled()
  })

  it('records a session that appears mid-flight and rings when it later idles', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true })
    b.list.set(listState([summary({ running: true, updatedAt: 3 })]))
    expect(b.engine.playBuiltin).not.toHaveBeenCalled()
    b.list.set(listState([summary({ running: false, updatedAt: 4 })]))
    expect(b.engine.playBuiltin).toHaveBeenCalledTimes(1)
  })

  it('drops removed sessions without ringing', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true })
    b.list.set(listState([summary({ running: true })]))
    b.list.set(listState([]))
    b.list.set(listState([summary({ running: false, updatedAt: 2 })]))
    // The fresh appearance only records; the second snapshot's running=false
    // is a first observation, so nothing rings.
    expect(b.engine.playBuiltin).not.toHaveBeenCalled()
  })

  it('re-baselines on connection/reset so reconnect replay cannot ring, then resumes edges', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true })
    b.list.set(listState([summary({ running: true })]))
    b.ctx.emit('connection/reset')
    // Reconnect replays the same running state: the re-baseline records it.
    b.list.set(listState([summary({ running: true, updatedAt: 2 })]))
    expect(b.engine.playBuiltin).not.toHaveBeenCalled()
    b.list.set(listState([summary({ running: false, updatedAt: 3 })]))
    expect(b.engine.playBuiltin).toHaveBeenCalledTimes(1)
  })

  it('adopts host settings and emits the config event; identical re-reads are quiet', () => {
    const b = bench()
    const events: NotifySettings[] = []
    b.ctx.on('notify/config', (config) => { events.push(config) })
    b.publishHost({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'tts', ttsText: 'hi' })
    expect(b.runtime.getConfig()).toEqual({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'tts', ttsText: 'hi' })
    expect(events).toHaveLength(1)
    b.publishHost({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'tts', ttsText: 'hi' })
    expect(events).toHaveLength(1)
  })

  it('writes one field through setField and no-ops identical values', () => {
    const b = bench()
    b.publishHost({ ...DEFAULT_NOTIFY_SETTINGS })
    const events: NotifySettings[] = []
    b.ctx.on('notify/config', (config) => { events.push(config) })
    b.runtime.setField('enabled', true)
    expect(b.runtime.getConfig().enabled).toBe(true)
    expect(b.hostSet).toHaveBeenCalledWith('enabled', true)
    expect(events).toHaveLength(1)
    const revision = b.runtime.revision
    b.runtime.setField('enabled', true)
    expect(events).toHaveLength(1)
    expect(b.runtime.revision).toBe(revision)
    expect(b.hostSet).toHaveBeenCalledTimes(1)
  })

  it('preview plays the current method regardless of the master switch', () => {
    const b = bench({ ...DEFAULT_NOTIFY_SETTINGS, enabled: false, method: 'custom', customAudioUrl: 'https://x/p.wav' })
    b.runtime.preview()
    expect(b.engine.playCustom).toHaveBeenCalledWith('https://x/p.wav')
    b.runtime.setField('method', 'tts')
    b.runtime.preview()
    expect(b.engine.playTts).toHaveBeenCalledWith('回答完成')
  })
})
