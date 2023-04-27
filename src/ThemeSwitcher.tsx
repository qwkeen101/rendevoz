import { useEffect } from 'react'
import Colors, { Background, Font, ThemeVars } from './consts/colors'
import { useMount } from './hooks'
import ClassName from './styles/classNames'
import { useSetting } from './core'

const setColor = (key: string, value: string) => {
  document.body.style.setProperty(key, value)
}
const ThemeSwitcher = () => {
  const [setting] = useSetting()
  useMount(() => {
    document.body.classList.add(ClassName.defaultFont('1rem', 400))
    setColor('background', Colors.Background.Global)
  })
  useEffect(() => {
    Object.entries(ThemeVars).forEach(([key, color]) => {
      setColor(key, color)
    })
    if (!setting.general.darkMode) {
      setColor(Font.Primary, Colors.Font.Black)
      setColor(Font.Secondary, Colors.Font.SilverBlue)
      setColor(Font.Tertiary, Colors.Font.Caption)
      setColor(Background.Linear, Colors.Background.LightLinear)
      setColor(Background.ButtonHover, Colors.Background.LightButtonHover)
      setColor(Background.Secondary, Colors.Background.LightSecondary)
      setColor(Background.Global, Colors.Background.Light)
      setColor(Background.Border, Colors.Background.ButtonHover)
      setColor(Background.HighContrast, 'rgba(255,255,255,0.5)')
    } else {
      setColor(Font.Primary, Colors.Font.White)
      setColor(Font.Secondary, Colors.Font.Silver)
      setColor(Font.Tertiary, Colors.Font.SilverSecond)
      setColor(Background.Linear, Colors.Background.DarkLinear)
      setColor(Background.Global, Colors.Background.Dark)
      setColor(Background.Secondary, Colors.Background.DarkSecondary)
      setColor(Background.ButtonHover, Colors.Background.DarkButtonHover)
      setColor(Background.Border, Colors.Background.ButtonHover)
      setColor(Background.HighContrast, 'rgba(255,255,255,0.1)')
    }
  }, [setting.general.darkMode])
  return null
}

export default ThemeSwitcher
