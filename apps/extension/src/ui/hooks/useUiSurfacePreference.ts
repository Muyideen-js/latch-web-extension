import { useEffect, useState } from 'react'

import type { UiSurfacePreference } from '../routing/routes'
import { UI_SURFACE_STORAGE_KEY } from '../lib/uiSurface'

export function useUiSurfacePreference() {
  const [pref, setPref] = useState<UiSurfacePreference>('popup')

  useEffect(() => {
    chrome.storage.local
      .get([UI_SURFACE_STORAGE_KEY])
      .then((res) => {
        const v = res[UI_SURFACE_STORAGE_KEY]
        if (v === 'popup' || v === 'sidepanel') setPref(v)
      })
      .catch(() => {})
  }, [])

  const persist = (v: UiSurfacePreference) => {
    setPref(v)
    void chrome.storage.local.set({ [UI_SURFACE_STORAGE_KEY]: v })
  }

  return { pref, setPref: persist }
}
