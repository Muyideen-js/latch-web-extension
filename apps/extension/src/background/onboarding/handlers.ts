import type { BackgroundMessage } from '@latch/types'

import {
  STORAGE_KEYS,
  applyActionClickBehavior,
  ensureSetupStateMatchesAccounts,
  openOnboardingTab,
} from '../actionBehavior'
import type { OkFn } from '../messageResponse'

type UiSurfacePreference = 'popup' | 'sidepanel'

/** Returns true if the message type was handled. */
export async function tryHandleOnboardingMessage(
  message: BackgroundMessage,
  sendResponse: (response: unknown) => void,
  ok: OkFn
): Promise<boolean> {
  switch (message.type) {
    case 'OPEN_WALLET_AFTER_ONBOARDING': {
      await chrome.storage.local.set({
        [STORAGE_KEYS.uiSurface]: 'sidepanel' satisfies UiSurfacePreference,
      })
      await ensureSetupStateMatchesAccounts()
      await applyActionClickBehavior()
      sendResponse(ok())
      return true
    }

    case 'OPEN_ONBOARDING_TAB': {
      await openOnboardingTab()
      sendResponse(ok())
      return true
    }

    default:
      return false
  }
}
