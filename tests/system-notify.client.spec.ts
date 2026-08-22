/** showSystemNotification: no-op without a Notification platform or granted
 * permission, and a tagged Notification otherwise. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SYSTEM_NOTIFICATION_TAG, showSystemNotification } from '../src/client/system-notify.ts'

afterEach(() => { vi.unstubAllGlobals() })

describe('showSystemNotification', () => {
  it('is a no-op when the platform capability is absent', () => {
    vi.stubGlobal('Notification', undefined)
    expect(() => { showSystemNotification('回答已完成', 'sess-1') }).not.toThrow()
  })

  it('is a no-op while permission is not granted', () => {
    for (const permission of ['default', 'denied'] as const) {
      const NotificationMock = vi.fn()
      NotificationMock.permission = permission
      vi.stubGlobal('Notification', NotificationMock)
      showSystemNotification('回答已完成', 'sess-1')
      expect(NotificationMock).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    }
  })

  it('creates one tagged Notification once permission is granted', () => {
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'granted'
    vi.stubGlobal('Notification', NotificationMock)
    showSystemNotification('需要授权', 'sess-1')
    expect(NotificationMock).toHaveBeenCalledTimes(1)
    expect(NotificationMock).toHaveBeenCalledWith('需要授权', { body: 'sess-1', tag: SYSTEM_NOTIFICATION_TAG })
  })
})
