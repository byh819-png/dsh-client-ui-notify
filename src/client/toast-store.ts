/**
 * Notification popup slot store: the single currently-shown bottom-right
 * toast. The plugin's apply-world `notify/alert` listener is the only writer
 * (`show` replaces the current toast — the newest alert wins); the popup
 * component dismisses itself after its hold, or the user closes it early.
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type { AlertKind } from './notify-runtime.ts'

/** One shown popup; `seq` keys the view so a re-show restarts the hold. */
export interface NotifyToastItem {
  /** Monotonic per-show counter (the component keys its view by this). */
  seq: number
  /** Which edge fired. */
  kind: AlertKind
  /** The session that crossed the edge. */
  sessionId: SessionId
  /** Human-facing label of that session, shown in the popup copy. */
  title: string
}

/** Popup store state: the current toast, or none. */
export interface NotifyToastState {
  /** The toast currently shown; null renders nothing. */
  toast: NotifyToastItem | null
}

/** Declared action shape giving the exported factory a stable return type. */
type NotifyToastActions = {
  /** Replace the current toast with a fresh one (the newest alert wins). */
  show: (draft: NotifyToastState, toast: NotifyToastItem) => void
  /** Hide the current toast (auto-dismiss or user close). */
  dismiss: (draft: NotifyToastState) => void
}

/**
 * Declares the popup state and write surface.
 * @returns the store handle.
 */
export function createNotifyToastStore(): EngineStoreHandle<NotifyToastState, NotifyToastActions> {
  return defineStore({
    init: (): NotifyToastState => ({ toast: null }),
    actions: {
      show: (draft, toast) => { draft.toast = toast },
      dismiss: (draft) => { draft.toast = null },
    },
  })
}
