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
  Transparent: '--font-transparent'
}

export const Background = {
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
  RadialGradient: '--radial-gradient-background'
}
export const Emphasis = {
  DarkEmphasis: '--dark-emphasis',
  LightEmphasis: '--light-emphasis',
  Emphasis: '--emphasis'
}
export const Common = {
  Green: '--green',
  Red: '--red',
  SelectColorTransparent: '--select-color-transparent',
  SelectColor: '--select-color'
}
const Colors = {
  Font: Object.fromEntries(Object.entries(Font).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Font, string>,
  Background: Object.fromEntries(Object.entries(Background).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Background, string>,
  Emphasis: Object.fromEntries(Object.entries(Emphasis).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Emphasis, string>,
  Common: Object.fromEntries(Object.entries(Common).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Common, string>
}

export default Colors
