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
  '--dark-linear-gradient-background': 'linear-gradient(116deg, rgba(5,5,5,0.1), rgba(23,23,23,0.1))',
  '--light-linear-gradient-background': 'linear-gradient(116deg, rgba(250,250,250,0.85), rgba(244,244,244,0.85))'
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
  Description: '--font-description'
}

export const Background = {
  GlobalBackground: '--global-background',
  LightBackground: '--light-background-color',
  DarkBackground: '--dark-background-color',
  DarkLinearBackground: '--dark-linear-gradient-background',
  LightLinearBackground: '--light-linear-gradient-background',
  LinearBackground: '--linear-background'
}
const Colors = {
  Font: Object.fromEntries(Object.entries(Font).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Font, string>,
  Background: Object.fromEntries(Object.entries(Background).map(i => [i[0], `var(${i[1]})`])) as Record<keyof typeof Background, string>
}

export default Colors
