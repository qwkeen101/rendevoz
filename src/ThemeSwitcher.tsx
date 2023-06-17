import { useEffect } from 'react'
import { useMount } from './hooks'
import ClassName from './styles/classNames'
import { useSetting } from './core'

const ThemeSwitcher = () => {
  const [setting] = useSetting()
  useMount(() => {
    document.body.classList.add(ClassName.defaultFont('1rem', 400))
  })
  useEffect(() => {
    if (!setting.general.darkMode) {
      document.documentElement.setAttribute('theme', 'light')
    } else {
      document.documentElement.setAttribute('theme', 'dark')
    }
  }, [setting.general.darkMode])
  return null
}

export default ThemeSwitcher
