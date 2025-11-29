import { Consts } from 'rendevoz'

import tinycolor from 'tinycolor2'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
export const GlobalTheme = {
  isDark: false
}
export const Font = {
  White: '--font-white',
  WhiteNoOpacity: '--font-white-solid',
  Silver: '--font-silver',
  SilverSecond: '--font-silver-second',
  Black: '--font-black',
  Primary: '--font-primary',
  PrimaryNoOpacity: '--font-primary-solid',
  Secondary: '--font-secondary',
  Tertiary: '--font-tertiary',
  Caption: '--font-caption',
  Description: '--font-tertiary',
  Link: '--font-link',
  SuperTransparent: '--font-s-transparent',
  Transparent: '--font-transparent',
  Blank: '#000000'
}

export const Background = {
  Blank: '#ffffff',
  BoxShadowBorder: '--box-shadow-border',
  Global: '--global-background',
  Light: '--light-background-color',
  PopoverBoxShadow: '--popover-box-shadow',
  LightSecondary: '--light-background-color-secondary',
  Dark: '--dark-background-color',
  DarkSecondary: '--dark-background-color-secondary',
  DarkLinear: '--dark-linear-gradient-background',
  LightLinear: '--light-linear-gradient-background',
  LightButtonHover: '--light-button-hover-background',
  DarkButtonHover: '--dark-button-hover-background',
  ButtonHover: '--button-hover-background',
  ButtonActive: '--button-active-background',
  DarkButtonActive: '--dark-button-active-background',
  LightButtonActive: '--light-button-active-background',
  Linear: '--linear-background',
  Popover: '--popover-background',
  Secondary: '--background-secondary',
  DarkBorder: '--dark-border',
  Border: '--border-background',
  LightHighContrast: '--light-high-contrast-background',
  DarkHighContrast: '--dark-high-contrast-background',
  HighContrast: '--high-contrast-background',
  HighlightBorder: '--highlight-border',
  LightHighlightBorder: '--light-highlight-border',
  DarkHighlightBorder: '--dark-highlight-border',
  LightScrollBar: '--light-scroll-bar',
  DarkScrollBar: '--dark-scroll-bar',
  Scrollbar: '--scroll-bar',
  BoxShadow: '--box-shadow',
  BorderBoxShadow: '--border-box-shadow'
}
export const Emphasis = {
  DarkEmphasis: '--dark-emphasis',
  LightEmphasis: '--light-emphasis',
  Emphasis: '--emphasis'
}
export const Common = {
  Green: '--green',
  FocusBoxShadow: '--focus-box-shadow',
  Red: '--red',
  Pink: '--pink',
  SelectColorTransparent: '--select-color-transparent',
  SelectColor: '--select-color',
  SelectColorTransparentLight: '--select-color-transparent-light'
}

const Consts = {
  BoxShadowBorderRight: 'var(--box-shadow-border) -1px 0px 0px 0px inset',
  BoxShadowBorderLeft: 'var(--box-shadow-border) 1px 0px 0px 0px inset',
  Border: '1px solid var(--border-background)'
}

const DarkColorCache: Record<string, string> = {}
const LightColorCache: Record<string, string> = {}
const getAdaptColor = (c?: string, darken = 35) => {
  if (!c) return undefined
  const key = `${c}_${darken}`
  if (GlobalTheme.isDark) {
    if (DarkColorCache[key]) return DarkColorCache[key]
    const transformed = darkenToSameBrightness(c, 0.32)
    DarkColorCache[key] = transformed
    return transformed
  } else {
    if (LightColorCache[key]) return LightColorCache[key]
    let transformed = darkenToSameBrightness(c, 0.84)
    LightColorCache[key] = transformed
    return transformed
  }
}
const getAlphaColor = (c: string | undefined, alpha: number) => {
  if (!c) return undefined
  return tinycolor(c).setAlpha(alpha).toRgbString()
}
const FontColorCache: Record<string, string> = {}
const getAdaptFontColor = (bg?: string) => {
  if (!bg) return undefined
  if (GlobalTheme.isDark) return undefined
  if (FontColorCache[bg]) return FontColorCache[bg]
  const t = darkenToSameBrightness(bg, 0.3)
  FontColorCache[bg] = t

  return t
}
function generateGradientColors(start: string, middle: string, end: string, steps: number) {
  const colors = []
  const halfSteps = Math.floor(steps / 2)

  // 从深绿到淡绿
  for (let i = 0; i <= halfSteps; i++) {
    const color = tinycolor.mix(start, middle, (i / halfSteps) * 100).toHexString()
    colors.push(color)
  }

  // 从淡绿到白色
  for (let i = 1; i <= halfSteps; i++) {
    const color = tinycolor.mix(middle, end, (i / halfSteps) * 100).toHexString()
    colors.push(color)
  }

  return colors
}
const getSimilarColors = (color: string, n: number, delta = 8) => {
  const colors = []
  const baseTinyColor = tinycolor(color)
  const direction = delta > 0 ? 'lighten' : 'darken'
  for (let i = 0; i < n; i++) {
    const newColor = baseTinyColor.clone()[direction](Math.abs((i + 1) * delta)) // 调整色相
    colors.push(newColor.toString())
  }

  return colors
}
const getRandomColor = (): string => {
  return DEFAULT_BACKGROUND_COLORS[Math.floor(Math.random() * DEFAULT_BACKGROUND_COLORS.length)]
}
const getRandomColors = (count: number): string[] => {
  const colors: string[] = []
  const step = 360 / count // 根据数量平分色相角度
  for (let i = 0; i < count; i++) {
    const hue = Math.floor(step * i) // 计算每个颜色的色相
    const saturation = 70 // 固定饱和度，可以调整
    const lightness = 70 // 固定亮度，可以调整
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
  }
  return colors
}
function darkenToSameBrightness(color: string, targetBrightness = 0.5) {
  const colorObj = tinycolor(color.replace('rgba', 'rgb'))
  const hsv = colorObj.toHsl()
  hsv.l = targetBrightness
  return tinycolor(hsv).toHexString()
}

const Colors = {
  Consts,
  getAdaptColor,
  getAdaptFontColor,
  getAlphaColor,
  getRandomColor,
  getRandomColors,
  getSimilarColors,
  Font: Object.fromEntries(Object.entries(Font).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Font, string>,
  Background: Object.fromEntries(Object.entries(Background).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Background, string>,
  Emphasis: Object.fromEntries(Object.entries(Emphasis).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Emphasis, string>,
  Common: Object.fromEntries(Object.entries(Common).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Common, string>
}

export default Colors
