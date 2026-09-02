/**
 * The notification runtime: adopts the durable settings scope, observes the
 * session list for answer-complete and authorization-needed edges, and plays
 * the configured sound. It holds no UI state — the settings row mirrors the
 * same config through the `notify/config` event.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SessionId } from '@deepseek-ai/dsh-session';
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client';
import { type NotifySettings } from '../notify-settings.ts';
import { type PlaybackEngine } from './sounds.ts';
/** Per-session observation mirror: the two edges the runtime rings on. */
export interface SessionObservation {
    /** Whether the session's agent is currently working. */
    running: boolean;
    /** Whether the session currently waits on an approval/question. */
    pending: boolean;
}
/** The two notification edges the runtime detects and reports. */
export type AlertKind = 'answer-complete' | 'auth-required';
/**
 * One fired notification edge: emitted for every ring (the bottom-right popup
 * follows the master switch and the event toggles, with no separate toggle);
 * the `notify/system` event carries the same payload for the browser system
 * notification.
 */
export interface NotifyAlert {
    /** Which edge fired. */
    kind: AlertKind;
    /** The session that crossed the edge. */
    sessionId: SessionId;
    /** Human-facing label of that session (durable title, project basename, or id). */
    title: string;
}
/**
 * Sound-notification owner: durable config in, playback decisions out.
 * Reads go through {@link getConfig}; user writes only through
 * {@link setField}; every accepted change emits `notify/config` with the full
 * section so the settings row can mirror it. Session observation baselines on
 * the first list snapshot (a session already idle at load rings nothing) and
 * re-baselines on `connection/reset` (reconnect replays status frames, which
 * would otherwise fabricate false edges). Every fired edge plays the sound and
 * emits `notify/alert` (the bottom-right popup follows the master switch and
 * the event toggles — no separate toggle); when the system toggle is on it
 * also emits `notify/system` for the browser system notification.
 */
export declare class NotifyRuntime {
    private readonly ctx;
    private readonly host;
    private readonly engine;
    private config;
    private revisionValue;
    private baseline;
    private readonly observed;
    /**
     * @param ctx - owning context (scope, list, and event listeners are released
     * through ctx.effect on dispose; the config event emits on it).
     * @param host - durable settings scope owned by the same plugin.
     * @param engine - playback engine this runtime dispatches into.
     */
    constructor(ctx: Context, host: SettingsScope<NotifySettings>, engine: PlaybackEngine);
    /**
     * Read the current accepted notification settings.
     * @returns a defensive copy of the section.
     */
    getConfig(): NotifySettings;
    /**
     * Read the current configuration revision (the row store's sync guard).
     * @returns the monotonic change counter.
     */
    get revision(): number;
    /**
     * Record one explicit user choice and persist it through the settings scope.
     * A no-op write (same value) neither emits nor touches the wire.
     * @param field - one durable section field.
     * @param value - the selected value.
     */
    setField<F extends keyof NotifySettings>(field: F, value: NotifySettings[F]): void;
    /**
     * Play the currently configured method once — the settings row's preview
     * path, independent of the master switch.
     */
    preview(): void;
    /** Adopt the scope's accepted durable section without writing it back. */
    private adopt;
    /**
     * Diff the latest list snapshot against the observation mirror and fire for
     * each enabled edge: running → idle fires "answer complete", absent →
     * present pending interaction fires "authorization needed". Each fire plays
     * the configured sound and emits `notify/alert` (the bottom-right popup
     * follows the master switch and the event toggles, so it accompanies every
     * ring); when the system toggle is on it also emits `notify/system` for the
     * browser system notification. The first snapshot only records (sessions
     * already idle at load fire nothing); new sessions record without firing;
     * removed sessions drop.
     */
    private observe;
    /** Forget observed state and re-baseline on the next snapshot (reconnect replay must not ring). */
    private rebaseline;
    private publish;
}
//# sourceMappingURL=notify-runtime.d.ts.map