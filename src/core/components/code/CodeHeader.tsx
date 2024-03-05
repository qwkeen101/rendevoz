import { MetaStore, ObjectStore } from '@/api/stores'
import { Content, Icon } from '@/components'
import Select from '@/components/base/select'
import { langs } from '@uiw/codemirror-extensions-langs'
import { ClassName } from 'rendevoz'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'

export const CodeLangs: (keyof typeof langs)[] = [
  'angular',
  'c',
  'cpp',
  'clojure',
  'coffeescript',
  'csharp',
  'css',
  'dart',
  'dockerfile',
  'erlang',
  'go',
  'haskell',
  'html',
  'http',
  'java',
  'javascript',
  'json',
  'jsx',
  'kotlin',
  'less',
  'lua',
  'markdown',
  'objectiveC',
  'perl',
  'php',
  'powershell',
  'python',
  'ruby',
  'rust',
  'scala',
  'sass',
  'shell',
  'solidity',
  'sql',
  'tsx',
  'typescript',
  'verilog',
  'vue',
  'vhdl',
  'xml',
  'yaml'
]
export default ({ id }: { id: number }) => {
  const code = ObjectStore('code').useValue(id)
  const defaultLang = useSelectGlobalAtomValue(SettingAtom, s => s.code.defaultLanguage)
  const language = code?.language || defaultLang || 'typescript'
  const codeMeta = MetaStore.useObjectToMetaValue(id)
  return (
    <Content
      flex
      alignItems={'center'}
      justifyContent={'space-between'}
      style={{
        padding: '6px 14px 0px'
      }}
    >
      <input
        onBlur={e => {
          codeMeta && MetaStore.updateMetaObject({ id: codeMeta.id, name: e.target.value })
        }}
        className={ClassName.noStyleInput}
        defaultValue={codeMeta?.name}
        onKeyDown={e => {
          if (isHotkey(KEY.Enter, e)) {
            e.currentTarget.blur()
          }
          if (isHotkey(KEY.Escape, e)) {
            e.currentTarget.blur()
          }
        }}
        style={{
          flexGrow: 1,
          marginRight: 20,
          fontWeight: 500
        }}
        placeholder={'Unnamed code'}
      ></input>
      <Content flex gap={8} alignItems={'center'}>
        <Icon
          onClick={() => {
            code?.content && navigator.clipboard.writeText(code.content)
          }}
          tooltip={'Copy'}
          name={'park-copy-one'}
          size={16}
          className={ClassName.flatButton(3, '4px')}
        />
        <Select
          align={'center'}
          onSelect={v => {
            ObjectStore('code').updateOne({ id, language: v[0] })
          }}
          value={language}
          menuStyle={{
            textTransform: 'capitalize',
            maxHeight: 300,
            overflowY: 'auto'
          }}
          style={{
            textTransform: 'capitalize'
          }}
          closeOnSelect={true}
          options={CodeLangs.sort().map(i => ({
            value: i,
            children: i
          }))}
        />
      </Content>
    </Content>
  )
}
