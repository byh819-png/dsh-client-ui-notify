// @vitest-environment jsdom
/** showSystemNotification: no-op without a Notification platform or granted
 * permission, a tagged Notification otherwise, and a click that focuses the
 * harness tab before running the caller's action. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SYSTEM_NOTIFICATION_TAG, showSystemNotification } from '../src/client/system-notify.ts'

afterEach(() => { vi.unstubAllGlobals() })

/** One constructed notification the spec can click. */
interface NotificationInstance {
  onclick?: () => void
  close: ReturnType<typeof vi.fn>
}

/**
 * Install a Notification constructor double reporting `permission`.
 * @param permission - the permission the installed double reports.
 * @returns the constructor mock and every instance it handed out.
 */
function stubNotification(permission: string): {
  construct: ReturnType<typeof vi.fn>
  instances: NotificationInstance[]
} {
  const instances: NotificationInstance[] = []
  // A function expression, not an arrow: the sender constructs the double
  // with `new`, and an arrow implementation is not constructible.
  const construct = vi.fn(function () {
    const instance: NotificationInstance = { close: vi.fn() }
    instances.push(instance)
    return instance
  })
  Object.assign(construct, { permission })
  vi.stubGlobal('Notification', construct)
  return { construct, instances }
}

describe('showSystemNotification', () => {
  it('is a no-op when the platform capability is absent', () => {
    vi.stubGlobal('Notification', undefined)
    expect(() => { showSystemNotification('回答已完成', 'sess-1', vi.fn()) }).not.toThrow()
  })

  it('is a no-op while permission is not granted', () => {
    for (const permission of ['default', 'denied'] as const) {
      const { construct } = stubNotification(permission)
      showSystemNotification('回答已完成', 'sess-1', vi.fn())
      expect(construct).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    }
  })

  it('creates one tagged Notification once permission is granted', () => {
    const { construct } = stubNotification('granted')
    showSystemNotification('需要授权', 'sess-1', vi.fn())
    expect(construct).toHaveBeenCalledTimes(1)
    expect(construct).toHaveBeenCalledWith('需要授权', { body: 'sess-1', tag: SYSTEM_NOTIFICATION_TAG })
  })

  it('focuses the tab, dismisses the notification, and runs the action on click', () => {
    const { instances } = stubNotification('granted')
    const focus = vi.fn()
    vi.stubGlobal('focus', focus)
    const open = vi.fn()
    showSystemNotification('需要授权', 'sess-1', open)
    const instance = instances[0]!
    expect(instance.onclick).toBeTypeOf('function')
    instance.onclick!()
    expect(focus).toHaveBeenCalledTimes(1)
    expect(instance.close).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledTimes(1)
  })
})
