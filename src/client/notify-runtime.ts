/**
 * The notification runtime: adopts the durable settings scope, observes the
 * session list for answer-complete and authorization-needed edges, and plays
 * the configured sound. It holds no UI state — the settings row mirrors the
 * same config through the `notify/config` event.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId, SessionListState, SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { DEFAULT_NOTIFY_SETTINGS, type NotifySettings } from '../notify-settings.ts'
import { dispatch, type PlaybackEngine } from './sounds.ts'

/** Per-session observation mirror: the two edges the runtime rings on. */
export interface SessionObservation {
  /** Whether the session's agent is currently working. */
  running: boolean
  /** Whether the session currently waits on an approval/question. */
  pending: boolean
}

/** One session summary projected to the two observed facts. */
function observationOf(summary: SessionListState['byId'][SessionId]): SessionObservation {
  return {
    running: summary.running,
    pending: summary.pendingInteraction !== undefined,
  }
}

/** Deep field comparison deciding whether a scope re-read changed anything. */
function sameSection(left: NotifySettings, right: NotifySettings): boolean {
  return left.enabled === right.enabled
    && left.onAnswerComplete === right.onAnswerComplete
    && left.onAuthRequired === right.onAuthRequired
    && left.method === right.method
    && left.ttsText === right.ttsText
    && left.customAudioUrl === right.customAudioUrl
}

/**
 * Sound-notification owner: durable config in, playback decisions out.
 * Reads go through {@link getConfig}; user writes only through
 * {@link setField}; every accepted change emits `notify/config` with the full
 * section so the settings row can mirror it. Session observation baselines on
 * the first list snapshot (a session already idle at load rings nothing) and
 * re-baselines on `connection/reset` (reconnect replays status frames, which
 * would otherwise fabricate false edges).
 */
export class NotifyRuntime {
  private config: NotifySettings = { ...DEFAULT_NOTIFY_SETTINGS }
  private revisionValue = 0
  private baseline = false
  private readonly observed = new Map<SessionId, SessionObservation>()

  /**
   * @param ctx - owning context (scope, list, and event listeners are released
   * through ctx.effect on dispose; the config event emits on it).
   * @param host - durable settings scope owned by the same plugin.
   * @param engine - playback engine this runtime dispatches into.
   */
  constructor(
    private readonly ctx: Context,
    private readonly host: SettingsScope<NotifySettings>,
    private readonly engine: PlaybackEngine,
  ) {
    ctx.effect(() => host.subscribe(() => { this.adopt() }), 'ui-notify: settings scope adoption')
    ctx.effect(() => ctx.on('connection/reset', () => { this.rebaseline() }), 'ui-notify: connection reset rebaseline')
    this.adopt()
    ctx.effect(() => ctx.sessions.list.subscribe(() => { this.observe() }), 'ui-notify: session list observation')
    this.observe()
  }

  /**
   * Read the current accepted notification settings.
   * @returns a defensive copy of the section.
   */
  getConfig(): NotifySettings {
    return { ...this.config }
  }

  /**
   * Read the current configuration revision (the row store's sync guard).
   * @returns the monotonic change counter.
   */
  get revision(): number {
    return this.revisionValue
  }

  /**
   * Record one explicit user choice and persist it through the settings scope.
   * A no-op write (same value) neither emits nor touches the wire.
   * @param field - one durable section field.
   * @param value - the selected value.
   */
  setField<F extends keyof NotifySettings>(field: F, value: NotifySettings[F]): void {
    if (this.config[field] === value) return
    this.config = { ...this.config, [field]: value }
    this.publish()
    void this.host.set(field, value)
  }

  /**
   * Play the currently configured method once — the settings row's preview
   * path, independent of the master switch.
   */
  preview(): void {
    dispatch(this.config, this.engine)
  }

  /** Adopt the scope's accepted durable section without writing it back. */
  private adopt(): void {
    const value = this.host.getSnapshot().value
    if (value === undefined) return
    const next = { ...DEFAULT_NOTIFY_SETTINGS, ...value }
    if (sameSection(next, this.config)) return
    this.config = next
    this.publish()
  }

  /**
   * Diff the latest list snapshot against the observation mirror and play for
   * each enabled edge: running → idle rings "answer complete", absent →
   * present pending interaction rings "authorization needed". The first
   * snapshot only records (sessions already idle at load ring nothing); new
   * sessions record without ringing; removed sessions drop.
   */
  private observe(): void {
    const snapshot = this.ctx.sessions.list.getSnapshot()
    if (!this.baseline) {
      this.baseline = true
      for (const [id, summary] of Object.entries(snapshot.byId)) {
        this.observed.set(id as SessionId, observationOf(summary))
      }
      return
    }
    for (const [id, summary] of Object.entries(snapshot.byId)) {
      const sessionId = id as SessionId
      const next = observationOf(summary)
      const prev = this.observed.get(sessionId)
      if (prev === undefined) {
        this.observed.set(sessionId, next)
        continue
      }
      if (prev.running && !next.running && this.config.enabled && this.config.onAnswerComplete) {
        dispatch(this.config, this.engine)
      }
      if (!prev.pending && next.pending && this.config.enabled && this.config.onAuthRequired) {
        dispatch(this.config, this.engine)
      }
      this.observed.set(sessionId, next)
    }
    for (const id of this.observed.keys()) {
      if (!(id in snapshot.byId)) this.observed.delete(id)
    }
  }

  /** Forget observed state and re-baseline on the next snapshot (reconnect replay must not ring). */
  private rebaseline(): void {
    this.observed.clear()
    this.baseline = false
    this.observe()
  }

  private publish(): void {
    this.revisionValue += 1
    this.ctx.emit('notify/config', this.config)
  }
}
