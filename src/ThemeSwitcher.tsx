import { useEffect, useLayoutEffect } from 'react'
import { useMount } from './hooks'
import ClassName from './styles/classNames'
import { useSetting } from './core'
import { GlobalTheme } from '@/consts'


const ThemeSwitcher = () => {
  const [setting, setSetting] = useSetting()
  useMount(() => {
    document.body.classList.add(ClassName.defaultFont('1rem', 400))
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
  return null
}

export default ThemeSwitcher
