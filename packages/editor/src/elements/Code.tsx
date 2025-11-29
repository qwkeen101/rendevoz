import { FC, useLayoutEffect } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../slate-react'
import { CustomElement } from '~/typings'
import { Node, Transforms } from 'slate'
import { Button } from '@/components'
import Select from '@/components/base/select'
import { capitalize } from 'lodash'
import { CodeLangs } from '@/core/components/code/CodeHeader'
import { useIsIn, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import classnames from 'classnames'

const Code: FC<RenderElementProps> = ({ element, children }) => {
  const codeEle = element as CustomElement & { type: 'code-block' }
  const defaultLang = useSelectGlobalAtomValue(SettingAtom, s => s.code.defaultLanguage)
  const editor = useSlateStatic()
  const { t } = useTranslation()
  const lang = codeEle.language || defaultLang || 'typescript'
  const { ref, isIn } = useIsIn()
  useLayoutEffect(() => {
    if (codeEle.content) {
      const path = ReactEditor.findPath(editor, codeEle)
      const newEle = { ...codeEle }
      delete newEle.content
      delete newEle.children
      Transforms.removeNodes(editor, { at: path })
      Transforms.insertNodes(
        editor,
        {
          ...newEle,
          children: [{ text: codeEle.content }]
        },
        { at: path }
      )
    }
  }, [])
  return (
    <div ref={ref} className="editor-disable-format">
      <div
        contentEditable={false}
        style={{
          fontSize: '0.86em'
        }}
        className={'absolute top-0 left-0 em:pt-1.5 em:pl-2.5 em:pr-1.5 w-full flex items-center justify-between gap-6 transparent-font'}
      >
        <Select
          closeOnSelect
          value={lang}
          style={{
            padding: '0.15em 0.3em'
          }}
          gap={'0.3em'}
          menuStyle={{
            overflowY: 'auto',
            maxHeight: 300
          }}
          options={CodeLangs.sort().map(i => ({
            value: i,
            children: capitalize(i)
          }))}
          containerStyle={{
            flexShrink: 0
          }}
          align={'center'}
          onSelect={v =>
            Transforms.setNodes(
              editor,
              {
                language: v[0]
              },
              {
                at: ReactEditor.findPath(editor, element)
              }
            )
          }
        ></Select>
        <Button.IconButton
          text={t(trans.Copy)}
          icon={Icons.Copy}
          smallText={false}
          style={{
            fontSize: '1em'
          }}
          size={14}
          className={classnames('!transition-opacity opacity-0', isIn && 'opacity-100')}
          onClick={() => {
            navigator.clipboard.writeText(Node.string(element))
            toast.success(t('general.Copied'))
          }}
        />
      </div>
      <pre
        className={'em:pt-11 em:pb-7 em:px-7'}
        style={{
          width: '100%',
          minHeight: 50,
          fontFamily: 'SFMono-Regular, Menlo, Consolas, "PT Mono", "Liberation Mono", Courier, monospace'
        }}
      >
        {children}
      </pre>
    </div>
  )
}

export default Code
