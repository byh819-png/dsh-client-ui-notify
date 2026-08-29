/** Host-side user-audio route: trust fence, id/extension parsing, GET/PUT/DELETE
 * against `$DSH_HOME/storages`, size/type guards, route registration, and the
 * orphaned-file retention sweep. */
import { mkdtempSync, readFileSync, rmSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import {
  apply, audioExtensionOfMediaType, audioMediaTypeOfExtension, audioStorageDir,
  AUDIO_URL_PREFIX, DEFAULT_NOTIFY_SETTINGS, handleAudioRequest, NOTIFY_SETTINGS_NAMESPACE,
  sweepOrphanedAudio,
} from '@deepseek-ai/dsh-client-ui-notify'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

const UUID = '01234567-89ab-4cde-8f01-23456789abcd'

interface Captured {
  status: number
  headers: Record<string, string>
  body: string
}

/** Collect writeHead/end into one ordered list. */
function capture() {
  const captured: Captured[] = []
  let pending: { status: number; headers: Record<string, string> } | undefined
  const res = {
    writeHead(status: number, headers: Record<string, string> = {}) {
      pending = { status, headers }
    },
    end(body?: unknown) {
      captured.push({
        status: pending?.status ?? 200,
        headers: pending?.headers ?? {},
        body: typeof body === 'string' ? body : body instanceof Buffer ? body.toString('utf8') : '',
      })
    },
  } as unknown as ServerResponse
  return { res, captured }
}

/** Minimal request with an async-iterable body (node:http requests are async iterables). */
function request(overrides: {
  url?: string
  method?: string
  headers?: Record<string, string>
  body?: Buffer[]
} = {}): IncomingMessage {
  const chunks = overrides.body ?? []
  let index = 0
  const req = {
    url: overrides.url ?? `${AUDIO_URL_PREFIX}/${UUID}.wav`,
    method: overrides.method ?? 'GET',
    headers: { host: '127.0.0.1:3080', ...overrides.headers },
    resume() {},
    [Symbol.asyncIterator]() {
      return {
        next: async () => index < chunks.length
          ? { done: false as const, value: chunks[index++]! }
          : { done: true as const, value: undefined },
      }
    },
  } as unknown as IncomingMessage
  return req
}

const ORIGINAL_DSH_HOME = process.env.DSH_HOME
let tempHome: string | undefined

afterEach(() => {
  if (tempHome !== undefined) rmSync(tempHome, { recursive: true, force: true })
  tempHome = undefined
  if (ORIGINAL_DSH_HOME === undefined) delete process.env.DSH_HOME
  else process.env.DSH_HOME = ORIGINAL_DSH_HOME
})

function withTempHome(): void {
  tempHome = mkdtempSync(join(tmpdir(), 'dsh-ui-notify-'))
  process.env.DSH_HOME = tempHome
}

describe('audio media type mapping', () => {
  it('resolves declared media types to extensions and back', () => {
    expect(audioExtensionOfMediaType('audio/wav')).toBe('wav')
    expect(audioExtensionOfMediaType('audio/x-wav')).toBe('wav')
    expect(audioExtensionOfMediaType('audio/mpeg')).toBe('mp3')
    expect(audioExtensionOfMediaType('audio/x-aiff')).toBe('aif')
    expect(audioExtensionOfMediaType('audio/midi')).toBe('midi')
    expect(audioExtensionOfMediaType('video/mp4')).toBeUndefined()
    expect(audioMediaTypeOfExtension('wav')).toBe('audio/wav')
    expect(audioMediaTypeOfExtension('mp4')).toBe('audio/mp4')
    expect(audioMediaTypeOfExtension('aif')).toBe('audio/x-aiff')
    expect(audioMediaTypeOfExtension('exe')).toBeUndefined()
  })

  it('falls back to the file-name extension when the browser reports no type', () => {
    expect(audioExtensionOfMediaType('', 'song.mp3')).toBe('mp3')
    expect(audioExtensionOfMediaType('', 'Ring.WAV')).toBe('wav')
    expect(audioExtensionOfMediaType('', 'notes.txt')).toBeUndefined()
    expect(audioExtensionOfMediaType('', 'noextension')).toBeUndefined()
    // A known type wins over the name; an unknown type still falls back to the name.
    expect(audioExtensionOfMediaType('audio/wav', 'x.mp3')).toBe('wav')
    expect(audioExtensionOfMediaType('application/octet-stream', 'x.ogg')).toBe('ogg')
  })
})

describe('audio route', () => {
  it('serves a stored file with its media type and immutable caching', async () => {
    withTempHome()
    const { res, captured } = capture()
    await handleAudioRequest(request({ method: 'PUT', body: [Buffer.from('RIFF')], headers: { 'content-type': 'audio/wav' } }), res)
    expect(captured[0]).toMatchObject({ status: 204 })

    const { res: getRes, captured: gets } = capture()
    await handleAudioRequest(request(), getRes)
    expect(gets[0]?.status).toBe(200)
    expect(gets[0]?.headers['content-type']).toBe('audio/wav')
    expect(gets[0]?.headers['cache-control']).toContain('immutable')
    expect(gets[0]?.body).toBe('RIFF')
    expect(readFileSync(join(audioStorageDir(), `${UUID}.wav`), 'utf8')).toBe('RIFF')
  })

  it('rejects requests whose Host is not loopback', async () => {
    withTempHome()
    const { res, captured } = capture()
    await handleAudioRequest(request({ headers: { host: 'attacker.example' } }), res)
    expect(captured[0]).toMatchObject({ status: 403 })
  })

  it('rejects paths outside the route prefix and malformed tails', async () => {
    withTempHome()
    const cases = [
      { url: '/other/audio/x.wav' },
      { url: `${AUDIO_URL_PREFIX}/not-a-uuid.wav` },
      { url: `${AUDIO_URL_PREFIX}/${UUID}.exe` },
      { url: `${AUDIO_URL_PREFIX}/${UUID}../secret.wav` },
    ]
    for (const c of cases) {
      const { res, captured } = capture()
      await handleAudioRequest(request({ url: c.url }), res)
      expect(captured[0]?.status).toBe(404)
    }
  })

  it('rejects an oversized upload', async () => {
    withTempHome()
    const { res, captured } = capture()
    const big = Buffer.alloc(1024 * 1024 + 1)
    await handleAudioRequest(request({ method: 'PUT', body: [big], headers: { 'content-type': 'audio/wav' } }), res)
    expect(captured[0]?.status).toBe(413)
    expect(existsSync(join(audioStorageDir(), `${UUID}.wav`))).toBe(false)
  })

  it('rejects an upload whose declared type is not audio', async () => {
    withTempHome()
    const { res, captured } = capture()
    await handleAudioRequest(request({ method: 'PUT', body: [Buffer.from('x')], headers: { 'content-type': 'text/plain' } }), res)
    expect(captured[0]?.status).toBe(415)
  })

  it('answers 404 for a missing file on GET and DELETE', async () => {
    withTempHome()
    for (const method of ['GET', 'DELETE'] as const) {
      const { res, captured } = capture()
      await handleAudioRequest(request({ method }), res)
      expect(captured[0]?.status).toBe(404)
    }
  })

  it('deletes a stored file', async () => {
    withTempHome()
    const { res } = capture()
    await handleAudioRequest(request({ method: 'PUT', body: [Buffer.from('RIFF')], headers: { 'content-type': 'audio/wav' } }), res)
    const file = join(audioStorageDir(), `${UUID}.wav`)
    expect(existsSync(file)).toBe(true)
    const { res: delRes, captured: dels } = capture()
    await handleAudioRequest(request({ method: 'DELETE' }), delRes)
    expect(dels[0]?.status).toBe(204)
    expect(existsSync(file)).toBe(false)
  })

  it('answers 405 for unsupported methods', async () => {
    withTempHome()
    const { res, captured } = capture()
    await handleAudioRequest(request({ method: 'POST', body: [Buffer.from('x')] }), res)
    expect(captured[0]?.status).toBe(405)
  })

  it('rejects an upload with no declared content type', async () => {
    withTempHome()
    const { res, captured } = capture()
    await handleAudioRequest(request({ method: 'PUT', body: [Buffer.from('x')], headers: {} }), res)
    expect(captured[0]?.status).toBe(415)
  })

  it('answers 500 when the backend read fails for a non-missing reason', async () => {
    withTempHome()
    // A directory standing where the file should be makes readFile throw EISDIR.
    mkdirSync(join(audioStorageDir(), `${UUID}.wav`), { recursive: true })
    const { res, captured } = capture()
    await handleAudioRequest(request(), res)
    expect(captured[0]?.status).toBe(500)
  })

  it('answers 500 when the backend write fails', async () => {
    withTempHome()
    // A directory standing where the file should be makes writeFile throw EISDIR.
    mkdirSync(join(audioStorageDir(), `${UUID}.wav`), { recursive: true })
    const { res, captured } = capture()
    await handleAudioRequest(request({ method: 'PUT', body: [Buffer.from('RIFF')], headers: { 'content-type': 'audio/wav' } }), res)
    expect(captured[0]?.status).toBe(500)
  })

  it('answers 500 when the backend delete fails', async () => {
    withTempHome()
    // A non-empty directory cannot be unlinked, so the delete fails with EPERM.
    const dir = join(audioStorageDir(), `${UUID}.wav`)
    mkdirSync(join(dir, 'child'), { recursive: true })
    const { res, captured } = capture()
    await handleAudioRequest(request({ method: 'DELETE' }), res)
    expect(captured[0]?.status).toBe(500)
  })

  it('registers the prefix route and the settings namespace on apply', async () => {
    const ctx = new Context()
    const registered: unknown[] = []
    ctx.provide('webServer', {
      register: (route: unknown) => {
        registered.push(route)
        return () => {}
      },
    } as never)
    await ctx.plugin(MemorySettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    expect(registered).toHaveLength(1)
    expect(registered[0]).toMatchObject({ kind: 'prefix', path: AUDIO_URL_PREFIX })
    expect(ctx.settings.get(settingsNamespace(NOTIFY_SETTINGS_NAMESPACE))).toEqual(DEFAULT_NOTIFY_SETTINGS)
    await fiber.dispose()
    expect(registered).toHaveLength(1)
  })
})

describe('audio retention sweep', () => {
  it('keeps the file the setting references and removes the rest', async () => {
    withTempHome()
    const dir = audioStorageDir()
    mkdirSync(dir, { recursive: true })
    const kept = `${UUID}.wav`
    const orphan = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.ogg'
    writeFileSync(join(dir, kept), 'keep')
    writeFileSync(join(dir, orphan), 'drop')
    expect(await sweepOrphanedAudio(`${AUDIO_URL_PREFIX}/${kept}`)).toBe(1)
    expect(existsSync(join(dir, kept))).toBe(true)
    expect(existsSync(join(dir, orphan))).toBe(false)
  })

  it('removes every hosted file when the setting holds no hosted reference', async () => {
    withTempHome()
    const dir = audioStorageDir()
    mkdirSync(dir, { recursive: true })
    const a = join(dir, `${UUID}.wav`)
    const b = join(dir, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.mp3')
    for (const referenced of ['', 'https://example.com/ring.wav'] as const) {
      writeFileSync(a, 'a')
      writeFileSync(b, 'b')
      expect(await sweepOrphanedAudio(referenced)).toBe(2)
      expect(readdirSync(dir)).toEqual([])
    }
    writeFileSync(a, 'a')
    expect(await sweepOrphanedAudio(undefined)).toBe(1)
  })

  it('never touches files that do not match the canonical audio id pattern', async () => {
    withTempHome()
    const dir = audioStorageDir()
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'notes.txt'), 'keep')
    writeFileSync(join(dir, 'ring.wav'), 'keep')
    expect(await sweepOrphanedAudio(undefined)).toBe(0)
    expect(existsSync(join(dir, 'notes.txt'))).toBe(true)
    expect(existsSync(join(dir, 'ring.wav'))).toBe(true)
  })

  it('sweeps nothing when the audio directory does not exist', async () => {
    withTempHome()
    expect(await sweepOrphanedAudio(undefined)).toBe(0)
  })

  it('skips directory entries instead of failing the sweep', async () => {
    withTempHome()
    const dir = audioStorageDir()
    mkdirSync(join(dir, `${UUID}.wav`), { recursive: true })
    expect(await sweepOrphanedAudio(undefined)).toBe(0)
  })

  it('sweeps on activation against the loaded setting', async () => {
    withTempHome()
    const dir = audioStorageDir()
    mkdirSync(dir, { recursive: true })
    const kept = `${UUID}.wav`
    const orphan = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.ogg'
    writeFileSync(join(dir, kept), 'keep')
    writeFileSync(join(dir, orphan), 'drop')
    const ctx = new Context()
    class LoadedSettings extends MemorySettings {
      protected override load(): Promise<Record<string, unknown>> {
        return Promise.resolve({
          [NOTIFY_SETTINGS_NAMESPACE]: { customAudioUrl: `${AUDIO_URL_PREFIX}/${kept}` },
        })
      }
    }
    await ctx.plugin(LoadedSettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    // The sweep runs asynchronously after activation; wait for its observable effect.
    expect(existsSync(join(dir, kept))).toBe(true)
    await vi.waitFor(() => { expect(existsSync(join(dir, orphan))).toBe(false) })
    await fiber.dispose()
  })
})
