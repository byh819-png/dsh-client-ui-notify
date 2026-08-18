// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { apply as nodeApply } from '@deepseek-ai/dsh-client-ui-notify'
import { apply as clientApply, inject, NotifyRuntime } from '@deepseek-ai/dsh-client-ui-notify/client'
import * as NotifyInvariant from '@deepseek-ai/dsh-client-ui-notify/invariant'
import { apply as localeApply, inject as localeInject } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-runtime/client'
import { createSnapshotStore, type SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import InvariantRegistry from '@deepseek-ai/dsh-invariants'
import { stubSettingsScope } from '@deepseek-ai/dsh-client-test-runtime'

describe('invariant companion', () => {
  it('registers under the package name with an empty installer', async () => {
    const ctx = new Context()
    await ctx.plugin(InvariantRegistry, { enabled: true })
    await expect(ctx.plugin(NotifyInvariant).await()).resolves.toBeDefined()
  })

  it('node-half waits for optional Host services', () => {
    nodeApply(new Context())
    expect(true).toBe(true)
  })

  it('client apply provides ctx.notify over the slots/locale/sessions edges', async () => {
    // The feature registers its own notification row with localized copy and
    // observes the session list, hence the slots + locale + sessions edges.
    expect(inject).toEqual(['slots', 'locale', 'connection', 'remote', 'settingsScope', 'sessions'])
    const ctx = new Context()
    new SlotRegistry(ctx)
    ctx.provide('connection', {
      api: { settings: { describe: () => Promise.resolve({
        rpcId: 'notify-invariant' as never,
        result: { ok: true, value: { writable: true, hasDocument: false, namespaces: [] } },
      }) } },
      isLoopback: true,
    } as never)
    // The settings row's transport and the forwarded-event port.
    ctx.provide('remote', { $on: () => () => {} } as never)
    ctx.provide('settingsScope', { bind: () => stubSettingsScope().scope } as never)
    ctx.provide('sessions', {
      list: createSnapshotStore<SessionListState>({
        ids: [], byId: {}, current: undefined, phase: 'ready',
        subagentsByParent: {}, jobsBySession: {}, currentAddress: undefined,
      }),
    } as never)
    await ctx.plugin({ inject: localeInject, apply: localeApply }).await()
    await ctx.plugin({ inject, apply: clientApply }).await()
    expect(ctx.get('notify')).toBeInstanceOf(NotifyRuntime)
  })
})
