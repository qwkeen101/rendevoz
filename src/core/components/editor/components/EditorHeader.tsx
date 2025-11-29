import { Icon, IconWithPopover, WithBorder } from '@/components'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import { CustomEditor } from '~/typings'
import EditorSetting from '@/core/components/editor/components/EditorSetting'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

const EditorHeader = ({ title, editor }: { editor: CustomEditor; title: string }) => {
  const [state, setState] = useEditorState()
  const { t } = useTranslation()
  const { readOnly, header } = state
  const instance = useEditorInstance()
  return (
    <div className={'flex w-full @container items-center justify-between py-3 pr-2 pl-2 gap-8'}>
      <div className={'items-center flex'}>
        {header?.leftExtra}
        {header?.display?.title !== false && <div className={'line-clamp-1 ml-2'}>{title}</div>}
      </div>
      <div className={'flex gap-5 grow shrink-0 pr-2 items-center justify-end'}>
        {header?.rightExtra}
        {header?.display?.modeSwitcher !== false && (
          <Icon
            size={20}
            tooltip={!readOnly ? t('editor.Reader mode') : t('editor.Edit mode')}
            className={'hover-active-button'}
            name={readOnly ? 'park-edit' : 'park-book-open'}
            onClick={() => setState(s => ({ ...s, readOnly: !s.readOnly }))}
          />
        )}
        {header?.display?.search !== false && (
          <Icon
            size={20}
            tooltip={t(trans.Search)}
            className={'hover-active-button'}
            name={Icons.Search}
            onClick={() => instance.searchOps?.toggleSearch()}
          />
        )}
        <Icon
          onClick={() => {
            setState(s => ({ ...s, sidebarVisible: !s.sidebarVisible }))
          }}
          size={20}
          className={'hover-active-button'}
          name={'custom-right-bar'}
        />
        <IconWithPopover
          padding={6}
          renderOnParent={false}
          align={'end'}
          placement={['bottom']}
          size={20}
          content={setV => (
            <WithBorder className={'min-w-56'}>
              <EditorSetting onClose={() => setV(false)} editor={editor} />
            </WithBorder>
          )}
          name={Icons.More}
          className={'hover-active-button'}
        />
      </div>
    </div>
  )
}

export default EditorHeader
