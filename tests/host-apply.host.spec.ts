import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { SettingsProvider, settingsNamespace, type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import {
  apply, DEFAULT_NOTIFY_SETTINGS, isNotifyMethod, NOTIFY_SETTINGS_NAMESPACE,
} from '@deepseek-ai/dsh-client-ui-notify'

class MemorySettings extends SettingsProvider {
  readonly writable = true
  protected load(): Promise<Record<string, unknown>> { return Promise.resolve({}) }
  protected persist(_ns: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

describe('ui-notify host', () => {
  it('registers, validates, and disposes the durable notification namespace with its fiber', async () => {
    const ctx = new Context()
    await ctx.plugin(MemorySettings).await()
    const fiber = ctx.plugin({ apply })
    await fiber.await()
    const ns = settingsNamespace(NOTIFY_SETTINGS_NAMESPACE)
    // The schema resolves every default on registration.
    expect(ctx.settings.get(ns)).toEqual(DEFAULT_NOTIFY_SETTINGS)
    await ctx.settings.update(ns, { enabled: true, method: 'tts' })
    expect(ctx.settings.get(ns)).toEqual({ ...DEFAULT_NOTIFY_SETTINGS, enabled: true, method: 'tts' })
    // The method union refuses unknown values at the earliest point.
    await expect(ctx.settings.update(ns, { method: 'nope' })).rejects.toThrow()
    await fiber.dispose()
    expect(ctx.settings.describe().map(row => row.ns)).not.toContain(ns)
  })

  it('narrows persistable methods at the settings boundary', () => {
    expect(isNotifyMethod('builtin')).toBe(true)
    expect(isNotifyMethod('tts')).toBe(true)
    expect(isNotifyMethod('custom')).toBe(true)
    expect(isNotifyMethod('nope')).toBe(false)
  })

  it('activates quietly without a settings provider', () => {
    const ctx = new Context()
    expect(() => { apply(ctx) }).not.toThrow()
  })
})
