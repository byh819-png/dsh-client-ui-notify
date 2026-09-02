import { BUILTIN_RINGTONE_DATA_URI } from "./builtin-ringtone.js";
/**
 * Route one notification through the engine selected by the config's method.
 * @param config - current notification settings.
 * @param engine - playback engine to dispatch into.
 */
export function dispatch(config, engine) {
    switch (config.method) {
        case 'builtin':
            engine.playBuiltin();
            return;
        case 'tts':
            engine.playTts(config.ttsText);
            return;
        case 'custom':
            engine.playCustom(config.customAudioUrl);
            return;
        default: throw new TypeError(`unknown notification method: ${String(config.method)}`);
    }
}
/** Start one audio element without letting an autoplay-policy rejection (or a
 * stub environment returning a non-promise) throw from an event handler. */
function playSafely(audio) {
    const playback = audio.play();
    if (playback !== undefined && typeof playback.catch === 'function') {
        void playback.catch(() => { });
    }
}
/**
 * Real browser playback. Every entry degrades to a no-op when the platform
 * capability is absent (jsdom tests, privacy modes) or the input is empty, so
 * a misconfigured notification never throws from an event handler.
 * @returns the browser playback engine.
 */
export function createBrowserEngine() {
    return {
        playBuiltin() {
            if (typeof Audio === 'undefined')
                return;
            playSafely(new Audio(BUILTIN_RINGTONE_DATA_URI));
        },
        playTts(text) {
            if (typeof speechSynthesis === 'undefined' || text === '')
                return;
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        },
        playCustom(url) {
            if (typeof Audio === 'undefined' || url === '')
                return;
            playSafely(new Audio(url));
        },
    };
}
//# sourceMappingURL=sounds.js.map