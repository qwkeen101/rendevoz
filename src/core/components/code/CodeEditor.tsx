import CodeMirror from '@uiw/react-codemirror'
import { css } from '@emotion/css'
import darkCodeTheme from '@/core/components/code/darkCodeTheme'
import lightCodeTheme from '@/core/components/code/lightCodeTheme'
import { langs } from '@uiw/codemirror-extensions-langs'
import { useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'

export default ({
  value,
  onChange,
  editable,
  language
}: {
  value?: string
  onChange?: (v: string) => void
  language?: string
  editable?: boolean
}) => {
  const darkMode = useSelectGlobalAtomValue(SettingAtom, s => s.general.darkMode)
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
      theme={darkMode ? darkCodeTheme() : lightCodeTheme()}
      basicSetup={true}
      value={value}
      style={{
        outline: 'none'
      }}
      extensions={[langs[language ?? 'typescript']()]}
      onChange={onChange}
    />
  )
}
