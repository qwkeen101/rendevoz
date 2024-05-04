import { useEffect, useLayoutEffect } from 'react'
import { useMount } from '../../hooks'
import ClassName from '../../styles/classNames'
import { useSetting } from '../../core'
import { GlobalTheme } from '@/consts'
import { createPortal } from 'react-dom'
import { getOS } from '@/App'

const ThemeSwitcher = () => {
  const [setting, setSetting] = useSetting()
  useMount(() => {
    document.body.classList.add(ClassName.defaultFont('1rem', 400))
    const os = getOS()
    if (os === 'windows') {
      document.documentElement.setAttribute('custom-scrollbar', 'true')
    }
  })
  useEffect(() => {
    if (setting.general.followSystemTheme) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      setSetting(s => ({
        ...s,
        general: {
          ...s.general,
          darkMode: mq.matches
        }
      }))
      const listener = e => {
        if (e.matches) {
          setSetting(s => ({
            ...s,
            general: {
              ...s.general,
              darkMode: true
            }
          }))
        } else {
          setSetting(s => ({
            ...s,
            general: {
              ...s.general,
              darkMode: false
            }
          }))
        }
      }
      mq.addEventListener('change', listener)
      return () => {
        mq.removeEventListener('change', listener)
      }
    }
  }, [setting.general.followSystemTheme])
  useLayoutEffect(() => {
    GlobalTheme.isDark = setting.general.darkMode
    if (!setting.general.darkMode) {
      document.documentElement.setAttribute('theme', 'light')
    } else {
      document.documentElement.setAttribute('theme', 'dark')
    }
  }, [setting.general.darkMode])
  if (setting.general.globalCSS) {
    return createPortal(<style>{setting.general.globalCSS}</style>, document.head)
  }
  return null
}

export default ThemeSwitcher
