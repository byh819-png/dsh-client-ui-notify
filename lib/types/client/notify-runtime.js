import { DEFAULT_NOTIFY_SETTINGS } from "../notify-settings.js";
import { dispatch } from "./sounds.js";
/** One session summary projected to the two observed facts. */
function observationOf(summary, pending) {
    return {
        running: summary.running,
        pending,
    };
}
/** Deep field comparison deciding whether a scope re-read changed anything. */
function sameSection(left, right) {
    return left.enabled === right.enabled
        && left.systemNotify === right.systemNotify
        && left.onAnswerComplete === right.onAnswerComplete
        && left.onAuthRequired === right.onAuthRequired
        && left.method === right.method
        && left.ttsText === right.ttsText
        && left.customAudioUrl === right.customAudioUrl;
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
export class NotifyRuntime {
    ctx;
    host;
    engine;
    config = { ...DEFAULT_NOTIFY_SETTINGS };
    revisionValue = 0;
    baseline = false;
    observed = new Map();
    /**
     * @param ctx - owning context (scope, list, and event listeners are released
     * through ctx.effect on dispose; the config event emits on it).
     * @param host - durable settings scope owned by the same plugin.
     * @param engine - playback engine this runtime dispatches into.
     */
    constructor(ctx, host, engine) {
        this.ctx = ctx;
        this.host = host;
        this.engine = engine;
        ctx.effect(() => host.subscribe(() => { this.adopt(); }), 'ui-notify: settings scope adoption');
        ctx.effect(() => ctx.on('connection/reset', () => { this.rebaseline(); }), 'ui-notify: connection reset rebaseline');
        this.adopt();
        ctx.effect(() => ctx.sessions.list.subscribe(() => { this.observe(); }), 'ui-notify: session list observation');
        ctx.effect(() => ctx.uiSession.pendingInteractions.subscribe(() => { this.observe(); }), 'ui-notify: pending interaction observation');
        this.observe();
    }
    /**
     * Read the current accepted notification settings.
     * @returns a defensive copy of the section.
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Read the current configuration revision (the row store's sync guard).
     * @returns the monotonic change counter.
     */
    get revision() {
        return this.revisionValue;
    }
    /**
     * Record one explicit user choice and persist it through the settings scope.
     * A no-op write (same value) neither emits nor touches the wire.
     * @param field - one durable section field.
     * @param value - the selected value.
     */
    setField(field, value) {
        if (this.config[field] === value)
            return;
        this.config = { ...this.config, [field]: value };
        this.publish();
        void this.host.set(field, value);
    }
    /**
     * Play the currently configured method once — the settings row's preview
     * path, independent of the master switch.
     */
    preview() {
        dispatch(this.config, this.engine);
    }
    /** Adopt the scope's accepted durable section without writing it back. */
    adopt() {
        const value = this.host.getSnapshot().value;
        if (value === undefined)
            return;
        const next = { ...DEFAULT_NOTIFY_SETTINGS, ...value };
        if (sameSection(next, this.config))
            return;
        this.config = next;
        this.publish();
    }
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
    observe() {
        const snapshot = this.ctx.sessions.list.getSnapshot();
        // Pending UI interactions (approval, plan review, ask-user) are no longer
        // a SessionSummary field in 0.1.2-alpha.1; they live in the uiSession
        // service's pendingInteractions map, keyed by session id. A present key
        // means the session waits on some interaction.
        const pending = this.ctx.uiSession?.pendingInteractions.getSnapshot() ?? new Map();
        if (!this.baseline) {
            this.baseline = true;
            for (const [id, summary] of Object.entries(snapshot.byId)) {
                this.observed.set(id, observationOf(summary, pending.has(id)));
            }
            return;
        }
        for (const [id, summary] of Object.entries(snapshot.byId)) {
            const sessionId = id;
            const next = observationOf(summary, pending.has(sessionId));
            const prev = this.observed.get(sessionId);
            if (prev === undefined) {
                this.observed.set(sessionId, next);
                continue;
            }
            if (prev.running && !next.running && this.config.enabled && this.config.onAnswerComplete) {
                dispatch(this.config, this.engine);
                this.ctx.emit('notify/alert', { kind: 'answer-complete', sessionId, title: summary.displayTitle });
                if (this.config.systemNotify) {
                    this.ctx.emit('notify/system', { kind: 'answer-complete', sessionId, title: summary.displayTitle });
                }
            }
            if (!prev.pending && next.pending && this.config.enabled && this.config.onAuthRequired) {
                dispatch(this.config, this.engine);
                this.ctx.emit('notify/alert', { kind: 'auth-required', sessionId, title: summary.displayTitle });
                if (this.config.systemNotify) {
                    this.ctx.emit('notify/system', { kind: 'auth-required', sessionId, title: summary.displayTitle });
                }
            }
            this.observed.set(sessionId, next);
        }
        for (const id of this.observed.keys()) {
            if (!(id in snapshot.byId))
                this.observed.delete(id);
        }
    }
    /** Forget observed state and re-baseline on the next snapshot (reconnect replay must not ring). */
    rebaseline() {
        this.observed.clear();
        this.baseline = false;
        this.observe();
    }
    publish() {
        this.revisionValue += 1;
        this.ctx.emit('notify/config', this.config);
    }
}
//# sourceMappingURL=notify-runtime.js.map