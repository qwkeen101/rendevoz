import { MetaStore, ObjectStore } from '@/api/stores'
import { Button, Icon } from '@/components'
import Select from '@/components/base/select'
import { langs } from '@uiw/codemirror-extensions-langs'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export const CodeLangs: (keyof typeof langs)[] = [
  'c',
  'cpp',
  'clojure',
  'coffeescript',
  'css',
  'dart',
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
  'php',
  'powershell',
  'python',
  'plain text',
  'rust',
  'solidity',
  'sql',
  'tsx',
  'typescript',
  'verilog',
  'vhdl',
  'xml',
  'yaml'
]
export default ({ id }: { id: number }) => {
  const code = ObjectStore('code').useValue(id)
  const { t } = useTranslation()
  const defaultLang = useSelectGlobalAtomValue(SettingAtom, s => s.code.defaultLanguage)
  const language = code?.language || defaultLang || 'typescript'
  const codeMeta = MetaStore.useObjectToMetaValue(id)
  return (
    <div className={'flex items-center justify-between py-2 pr-2 pl-4'}>
      <input
        onBlur={e => {
          codeMeta && MetaStore.updateMetaObject({ id: codeMeta.id, name: e.target.value })
        }}
        className={'flex-1 mr-6 font-medium'}
        defaultValue={codeMeta?.name}
        onKeyDown={e => {
          if (isHotkey(KEY.Enter, e)) {
            e.currentTarget.blur()
          }
          if (isHotkey(KEY.Escape, e)) {
            e.currentTarget.blur()
          }
        }}
        placeholder={t(trans.Untitled)}
      ></input>
      <div className={'transparent-font flex items-center gap-3'}>
        <Button.IconButton
          onClick={() => {
            if (code?.content) {
              navigator.clipboard.writeText(code.content)
              toast.success(t(trans.Copied))
            }
          }}
          icon={'park-copy-one'}
          text={t(trans.Copy)}
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
      </div>
    </div>
  )
}
