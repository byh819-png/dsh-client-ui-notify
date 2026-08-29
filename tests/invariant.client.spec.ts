// @vitest-environment jsdom
/** Client-side invariant companion coverage: the client apply provides
 * ctx.notify over the slots/locale/sessions edges. The Host half of the
 * companion lives in invariant.host.spec.ts. */
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { apply as clientApply, inject, NotifyRuntime } from '@deepseek-ai/dsh-client-ui-notify/client'
import { apply as localeApply, inject as localeInject } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import { stubSettingsScope } from '@deepseek-ai/dsh-client-test-runtime'

describe('invariant companion', () => {
  it('client apply provides ctx.notify over the slots/locale/sessions edges', async () => {
    // The feature registers its own notification row with localized copy and
    // observes the session list and pending interactions, hence the slots +
    // locale + sessions + uiSession edges.
    expect(inject).toEqual(['slots', 'locale', 'connection', 'remote', 'settingsScope', 'sessions', 'uiSession'])
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
    ctx.provide('uiSession', {
      pendingInteractions: createSnapshotStore<ReadonlyMap<string, unknown>>(new Map()),
    } as never)
    await ctx.plugin({ inject: localeInject, apply: localeApply }).await()
    await ctx.plugin({ inject, apply: clientApply }).await()
    expect(ctx.get('notify')).toBeInstanceOf(NotifyRuntime)
  })
})
