/**
 * @name duotone
 * @author Bram de Haan
 * by Bram de Haan, adapted from DuoTone themes by Simurai (http://simurai.com/projects/2016/01/01/duotone-themes)
 */
import { tags as t } from '@lezer/highlight'
import { createTheme, CreateThemeOptions } from '@uiw/codemirror-themes'

const defaultSettingsDuotoneLight: CreateThemeOptions['settings'] = {
  background: 'transparent',
  foreground: '#b29762',
  caret: '#93abdc',
  selection: 'var(--select-color-transparent)',
  selectionMatch: 'var(--select-color-transparent)',
  gutterBackground: 'transparent',
  gutterForeground: '#cdc4b1',
  gutterBorder: 'transparent',
  lineHighlight: 'transparent'
}

export default function lightCodeTheme(options?: Partial<CreateThemeOptions>) {
  const { theme = 'light', settings = {}, styles = [] } = options || {}
  return createTheme({
    theme: theme,
    settings: {
      ...defaultSettingsDuotoneLight,
      ...settings
    },
    styles: [
      { tag: [t.comment, t.bracket], color: '#b6ad9a' },
      { tag: [t.atom, t.number, t.keyword, t.link, t.attributeName, t.quote], color: '#063289' },
      { tag: [t.emphasis, t.heading, t.tagName, t.propertyName, t.variableName], color: '#2d2006' },
      { tag: [t.typeName, t.url, t.string], color: '#896724' },
      { tag: [t.operator, t.string], color: '#1659df' },
      { tag: [t.propertyName], color: '#b29762' },
      { tag: [t.unit, t.punctuation], color: '#063289' },
      ...styles
    ]
  })
}