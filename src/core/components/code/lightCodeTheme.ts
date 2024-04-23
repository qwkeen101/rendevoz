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

const defaultSettingsGithubLight: CreateThemeOptions['settings'] = {
  background: 'transparent',
  foreground: '#24292e',
  selection: 'var(--select-color-transparent)',
  selectionMatch: 'var(--select-color-transparent)',
  gutterBackground: 'transparent',
  gutterForeground: '#6e7781',
  gutterBorder: 'transparent',
  lineHighlight: 'transparent'
}

export const githubLightInit = (options?: Partial<CreateThemeOptions>) => {
  const { theme = 'light', settings = {}, styles = [] } = options || {}
  return createTheme({
    theme: theme,
    settings: {
      ...defaultSettingsGithubLight,
      ...settings
    },
    styles: [
      { tag: [t.standard(t.tagName), t.tagName], color: '#116329' },
      { tag: [t.comment, t.bracket], color: '#6a737d' },
      { tag: [t.className, t.propertyName], color: '#6f42c1' },
      { tag: [t.variableName, t.attributeName, t.number, t.operator], color: '#005cc5' },
      { tag: [t.keyword, t.typeName, t.typeOperator, t.typeName], color: '#d73a49' },
      { tag: [t.string, t.meta, t.regexp], color: '#032f62' },
      { tag: [t.name, t.quote], color: '#22863a' },
      { tag: [t.heading, t.strong], color: '#24292e', fontWeight: 'bold' },
      { tag: [t.emphasis], color: '#24292e', fontStyle: 'italic' },
      { tag: [t.deleted], color: '#b31d28', backgroundColor: 'ffeef0' },
      { tag: [t.atom, t.bool, t.special(t.variableName)], color: '#e36209' },
      { tag: [t.url, t.escape, t.regexp, t.link], color: '#032f62' },
      { tag: t.link, textDecoration: 'underline' },
      { tag: t.strikethrough, textDecoration: 'line-through' },
      { tag: t.invalid, color: '#cb2431' },
      ...styles
    ]
  })
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
