import type { UiSurfacePreference } from '../routing/routes'

export const UI_SURFACE_STORAGE_KEY = 'latch.uiSurface' as const

export async function openSidePanel() {
  if (!('sidePanel' in chrome)) return
  const win = await chrome.windows.getLastFocused()
  if (!win?.id) return
  await chrome.sidePanel.open({ windowId: win.id })
}

export async function setDefaultSurface(pref: UiSurfacePreference) {
  await chrome.storage.local.set({ [UI_SURFACE_STORAGE_KEY]: pref })
}
