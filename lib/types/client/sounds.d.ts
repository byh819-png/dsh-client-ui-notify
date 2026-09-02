/**
 * Playback engines for the three notification methods. The browser engine is
 * the only real Audio/speechSynthesis consumer; tests inject a fake engine so
 * `dispatch` stays a pure method decision.
 */
import type { NotifySettings } from '../notify-settings.ts';
/** Playback face the runtime dispatches through (browser engine or a test fake). */
export interface PlaybackEngine {
    /** Play the plugin-bundled ringtone. */
    playBuiltin(): void;
    /** Speak one text string through the platform speech synthesizer. */
    playTts(text: string): void;
    /** Play one audio source (http(s) URL or data URL). */
    playCustom(url: string): void;
}
/**
 * Route one notification through the engine selected by the config's method.
 * @param config - current notification settings.
 * @param engine - playback engine to dispatch into.
 */
export declare function dispatch(config: NotifySettings, engine: PlaybackEngine): void;
/**
 * Real browser playback. Every entry degrades to a no-op when the platform
 * capability is absent (jsdom tests, privacy modes) or the input is empty, so
 * a misconfigured notification never throws from an event handler.
 * @returns the browser playback engine.
 */
export declare function createBrowserEngine(): PlaybackEngine;
//# sourceMappingURL=sounds.d.ts.map