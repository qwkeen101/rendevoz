import { useEffect } from 'react'
import Colors, { Background, Font, ThemeVars } from './consts/colors'
import { useMount } from './hooks'
import ClassName from './styles/classNames'

const isLightMode = false
const setColor = (key: string, value: string) => {
  document.body.style.setProperty(key, value)
}
const ThemeSwitcher = () => {
  useMount(() => {
    document.body.classList.add(ClassName.defaultFont(14, 400))
    setColor('background', Colors.Background.GlobalBackground)
  })
  useEffect(() => {
    Object.entries(ThemeVars).forEach(([key, color]) => {
      setColor(key, color)
    })
    if (isLightMode) {
      setColor(Font.Primary, Colors.Font.Black)
      setColor(Font.Secondary, Colors.Font.SilverBlue)
      setColor(Font.Tertiary, Colors.Font.Caption)
      setColor(Background.LinearBackground, Colors.Background.LightLinearBackground)
    } else {
      setColor(Font.Primary, Colors.Font.White)
      setColor(Font.Secondary, Colors.Font.Silver)
      setColor(Font.Tertiary, Colors.Font.SilverSecond)
      setColor(Background.LinearBackground, Colors.Background.DarkLinearBackground)
      setColor(Background.GlobalBackground, Colors.Background.DarkBackground)
    }
  }, [isLightMode])
  return null
}

export default ThemeSwitcher
