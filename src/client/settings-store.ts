/**
 * Notification row slot store: a mirror of the runtime config. The plugin's
 * apply-world change listener is the only writer; the row component reads via
 * props.useStore.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'
import { DEFAULT_NOTIFY_SETTINGS, type NotifySettings } from '../notify-settings.ts'

/** Store state mirrored from the runtime config. */
export interface NotifyRowState {
  /** Latest accepted notification settings. */
  config: NotifySettings
  /** Runtime revision; -1 until first sync so revision 0 lands as a change. */
  revision: number
}

/** Declared action shape giving the exported factory a stable return type. */
type NotifyRowActions = {
  sync: (draft: NotifyRowState, config: NotifySettings, revision: number) => void
}

/**
 * Declares the notification row state and write surface.
 * @returns the store handle.
 */
export function createNotifyRowStore(): EngineStoreHandle<NotifyRowState, NotifyRowActions> {
  return defineStore({
    init: (): NotifyRowState => ({ config: { ...DEFAULT_NOTIFY_SETTINGS }, revision: -1 }),
    actions: {
      sync: (draft, config, revision) => {
        if (revision <= draft.revision) return
        draft.config = { ...config }
        draft.revision = revision
      },
    },
  })
}
