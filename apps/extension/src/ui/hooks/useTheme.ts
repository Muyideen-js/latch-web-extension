import { useEffect, useState } from 'react'

import type { Theme } from '../routing/routes'

const THEME_STORAGE_KEY = 'latch.theme' as const

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    chrome.storage.local
      .get([THEME_STORAGE_KEY])
      .then((res) => {
        const t = res[THEME_STORAGE_KEY]
        if (t === 'light' || t === 'dark') setTheme(t)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    void chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme })
  }, [theme])

  return { theme, setTheme }
}
