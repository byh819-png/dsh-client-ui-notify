// @vitest-environment jsdom
/** Sound engine: pure method dispatch and the browser engine's graceful
 * degradation when a platform capability is absent (jsdom provides neither
 * playback nor the Web Speech API). */
import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { DEFAULT_NOTIFY_SETTINGS } from '../src/notify-settings.ts'
import { createBrowserEngine, dispatch } from '../src/client/sounds.ts'

/** A fake engine typed by its mock members (property values, not methods). */
function fakeEngine(): { playBuiltin: Mock; playTts: Mock; playCustom: Mock } {
  return { playBuiltin: vi.fn(), playTts: vi.fn(), playCustom: vi.fn() }
}

describe('dispatch', () => {
  it('routes each built-in method to its engine entry', () => {
    const engine = fakeEngine()
    dispatch({ ...DEFAULT_NOTIFY_SETTINGS, method: 'builtin' }, engine)
    expect(engine.playBuiltin).toHaveBeenCalledTimes(1)
    expect(engine.playTts).not.toHaveBeenCalled()

    const tts = fakeEngine()
    dispatch({ ...DEFAULT_NOTIFY_SETTINGS, method: 'tts', ttsText: 'hi' }, tts)
    expect(tts.playTts).toHaveBeenCalledWith('hi')

    const custom = fakeEngine()
    dispatch({ ...DEFAULT_NOTIFY_SETTINGS, method: 'custom', customAudioUrl: 'https://x/a.wav' }, custom)
    expect(custom.playCustom).toHaveBeenCalledWith('https://x/a.wav')
  })

  it('fails loud on an unknown method', () => {
    const engine = fakeEngine()
    expect(() => { dispatch({ ...DEFAULT_NOTIFY_SETTINGS, method: 'nope' as never }, engine) })
      .toThrow(/unknown notification method/)
  })
})

describe('createBrowserEngine', () => {
  it('plays the built-in ringtone through an Audio element', () => {
    const play = vi.fn(() => Promise.resolve())
    const urls: string[] = []
    function FakeAudio(this: { play: typeof play }, url: string) {
      urls.push(url)
      this.play = play
    }
    vi.stubGlobal('Audio', FakeAudio)
    try {
      createBrowserEngine().playBuiltin()
      expect(urls[0]).toMatch(/^data:audio\/wav;base64,/u)
      expect(play).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('swallows a rejected autoplay attempt', () => {
    const play = vi.fn(() => Promise.reject(new Error('autoplay blocked')))
    function FakeAudio(this: { play: typeof play }, _url: string) {
      this.play = play
    }
    vi.stubGlobal('Audio', FakeAudio)
    try {
      expect(() => { createBrowserEngine().playBuiltin() }).not.toThrow()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('plays a custom source through an Audio element', () => {
    const play = vi.fn(() => Promise.resolve())
    function FakeAudio(this: { play: typeof play }, _url: string) {
      this.play = play
    }
    vi.stubGlobal('Audio', FakeAudio)
    try {
      createBrowserEngine().playCustom('https://x/c.wav')
      expect(play).toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('ignores a non-promise playback result (stub environments)', () => {
    // A stub environment whose play() returns a plain object (no catch) must
    // not throw — the alert is skipped like any autoplay rejection.
    function FakeAudio(this: { play: () => object }, _url: string) {
      this.play = () => ({})
    }
    vi.stubGlobal('Audio', FakeAudio)
    try {
      expect(() => { createBrowserEngine().playBuiltin() }).not.toThrow()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('degrades to a no-op when the platform capability is absent', () => {
    // jsdom defines Audio but no speechSynthesis; the undefined guards must
    // also hold when the whole capability is missing.
    vi.stubGlobal('Audio', undefined)
    const engine = createBrowserEngine()
    expect(() => { engine.playBuiltin() }).not.toThrow()
    expect(() => { engine.playCustom('https://x/a.wav') }).not.toThrow()
    vi.unstubAllGlobals()
    expect(() => { engine.playTts('hi') }).not.toThrow()
  })

  it('skips empty TTS text without touching the synthesizer', () => {
    const speak = vi.fn()
    class FakeUtterance { constructor(public text: string) {} }
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn(), speak })
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    try {
      createBrowserEngine().playTts('')
      expect(speak).not.toHaveBeenCalled()
      createBrowserEngine().playTts('hi')
      expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'hi' }))
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
