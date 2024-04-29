import { Consts } from 'rendevoz'

import tinycolor from 'tinycolor2'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
export const GlobalTheme = {
  isDark: false
}
export const Font = {
  White: '--font-white',
  Silver: '--font-silver',
  SilverSecond: '--font-silver-second',
  Black: '--font-black',
  SilverBlue: '--font-silver-blue',
  Primary: '--font-primary',
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
  LightRadialGradient: '--light-radial-gradient-background',
  DarkRadialGradient: '--dark-radial-gradient-background',
  RadialGradient: '--radial-gradient-background',
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
  RedTransparentLight: '--red-transparent-light',
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
const getAdaptColor = (c?: string, darken = 45) => {
  if (!c) return undefined
  if (GlobalTheme.isDark) {
    if (DarkColorCache[`${c}_${darken}`]) return DarkColorCache[`${c}_${darken}`]
    const transformed = tinycolor(c).darken(darken).desaturate(10).toHexString()
    DarkColorCache[`${c}_${darken}`] = transformed
    return transformed
  }
  return c
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
  const t = tinycolor(bg).darken(50).desaturate(10).toHexString()
  FontColorCache[bg] = t

  return t
}

const getRandomColor = (): string => {
  return DEFAULT_BACKGROUND_COLORS[Math.floor(Math.random() * DEFAULT_BACKGROUND_COLORS.length)]
}
const Colors = {
  Consts,
  getAdaptColor,
  getAdaptFontColor,
  getAlphaColor,
  getRandomColor,
  Font: Object.fromEntries(Object.entries(Font).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Font, string>,
  Background: Object.fromEntries(Object.entries(Background).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Background, string>,
  Emphasis: Object.fromEntries(Object.entries(Emphasis).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Emphasis, string>,
  Common: Object.fromEntries(Object.entries(Common).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Common, string>
}

export default Colors
