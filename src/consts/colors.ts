export const ThemeVars = {
  '--font-white': '#e8eaed',
  '--font-silver': '#d1d4dc',
  '--font-black': '#131722',
  '--font-silver-blue': '#616c77',
  '--font-silver-second': '#bdc1c6',
  '--font-caption': '#646a73',
  '--font-description': '#898989',
  '--light-background-color': '#FFFFFF',
  '--dark-background-color': '#202124',
  '--dark-linear-gradient-background': 'linear-gradient(116deg, rgba(5,5,5,0.4), rgba(23,23,23,0.4))',
  // '--light-linear-gradient-background': 'linear-gradient(116deg, rgba(250,250,250,0.85), rgba(244,244,244,0.85))',
  '--light-linear-gradient-background': 'linear-gradient(116deg, rgba(250,250,250,0.45), rgba(244,244,244,0.45))',
  //  '--light-linear-gradient-background': 'linear-gradient(116deg, rgba(244,244,244,0.45), rgba(223,223,223,0.45))',
  '--light-button-hover-background': 'rgba(31, 34, 37, 0.08)',
  '--dark-button-hover-background': 'rgba(221,212,224, 0.08)',
  '--light-background-color-secondary': '#dfdfdf',
  '--dark-background-color-secondary': '#464646'
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
  Description: '--font-tertiary'
}

export const Background = {
  Global: '--global-background',
  Light: '--light-background-color',
  LightSecondary: '--light-background-color-secondary',
  Dark: '--dark-background-color',
  DarkSecondary: '--dark-background-color-secondary',
  DarkLinear: '--dark-linear-gradient-background',
  LightLinear: '--light-linear-gradient-background',
  LightButtonHover: '--light-button-hover-background',
  DarkButtonHover: '--dark-button-hover-background',
  ButtonHover: '--button-hover-background',
  Linear: '--linear-background',
  Secondary: '--background-secondary',
  Border: '--border-background',
  HighContrast: '--high-contrast-background'
}
const Colors = {
  Font: Object.fromEntries(Object.entries(Font).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Font, string>,
  Background: Object.fromEntries(Object.entries(Background).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Background, string>
}

export default Colors
