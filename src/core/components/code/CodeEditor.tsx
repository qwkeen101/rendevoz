import CodeMirror from '@uiw/react-codemirror'
import { css } from '@emotion/css'
import darkCodeTheme from '@/core/components/code/darkCodeTheme'
import lightCodeTheme, { githubLightInit } from '@/core/components/code/lightCodeTheme'
import { langs } from '@uiw/codemirror-extensions-langs'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { CSSProperties } from 'react'

export default ({
  value,
  onChange,
  editable,
  language,
  style
}: {
  value?: string
  onChange?: (v: string) => void
  language?: string
  editable?: boolean
  style?: CSSProperties
}) => {
  const darkMode = useSelectGlobalAtomValue(SettingAtom, s => s.general.darkMode)
  const defaultLang = useSelectGlobalAtomValue(SettingAtom, s => s.code.defaultLanguage)
  return (
    <CodeMirror
      className={css({
        '.cm-editor': {
          outline: 'none'
        },
        '.cm-gutters': {
          border: 'none'
        }
      })}
      editable={editable}
      theme={darkMode ? darkCodeTheme() : githubLightInit()}
      basicSetup={true}
      value={value}
      style={{
        outline: 'none',
        ...style
      }}
      extensions={[langs[language ?? defaultLang ?? 'typescript']()]}
      onChange={onChange}
    />
  )
}
