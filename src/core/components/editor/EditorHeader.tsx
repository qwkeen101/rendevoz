import { AnimatePopover, Content, Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import UseEditorBarState from '@/core/components/editor/hooks/useEditorBarState'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import ClassName from '@/styles/classNames'
import { CustomEditor } from '~/typings'
import EditorSetting from '@/core/components/editor/components/setting/EditorSetting'
import { useTranslation } from 'react-i18next'

const EditorHeader = ({ title, editor }: { editor: CustomEditor; title: string }) => {
  const [barState, setEditorBarState] = UseEditorBarState()
  const [editorState, setEditorState] = useEditorState()
  const { readOnly, header } = editorState
  const { t } = useTranslation()
  return (
    <Content
      flex
      alignItems="center"
      style={{
        padding: '8px 12px 8px 8px',
        top: 0,
        zIndex: 99
      }}
      position={'sticky'}
      gap={30}
      justifyContent="space-between"
    >
      <Content flex alignItems={'center'} gap={6}>
        <AnimatePopover
          positions={['bottom']}
          align={'start'}
          padding={5}
          content={setV => (
            <WithBorder padding={'0.2rem 0 0.4rem'}>
              <Menu.NavigationMenu
                defaultSelected={[barState.sidebarActive ?? 'hide']}
                onSelect={v => {
                  setV(false)
                  if (v && v.type === 'item') {
                    setEditorBarState(s => ({ ...s, sidebarActive: v.key }))
                  }
                }}
                layout={[
                  {
                    type: 'title',
                    name: t('general.Sidebar')
                  },
                  {
                    type: 'item',
                    key: 'hide',
                    text: t('general.Hide sidebar')
                  },
                  {
                    type: 'item',
                    key: 'label',
                    text: t('general.Highlights')
                  },
                  {
                    type: 'item',
                    key: 'contents',
                    text: t('general.Contents')
                  },
                  {
                    type: 'item',
                    key: 'search',
                    text: t('general.Search')
                  },
                  {
                    type: 'item',
                    key: 'attachments',
                    text: t('general.Attachments')
                  },
                  {
                    type: 'item',
                    key: 'ai',
                    text: t('general.AI')
                  }
                ]}
              />
            </WithBorder>
          )}
        >
          <Content flex alignItems={'center'} gap={4} className={ClassName.flatButton(4, '5px')}>
            <Icon size={16} name={'custom-left-bar'} />
            <Icon size={14} name={'park-down'} />
          </Content>
        </AnimatePopover>
        {header?.display?.title !== false && (
          <div style={{ marginLeft: 4 }} className={'ellipsis-font-1 font-size-14'}>
            {title}
          </div>
        )}
      </Content>
      <Content flex gap={6}>
        {header?.rightExtra}
        {header?.display?.modeSwitcher !== false && (
          <Icon
            size={16}
            strokeWidth={3}
            className={ClassName.flatButton(4, '5px')}
            name={readOnly ? 'park-edit' : 'park-book-open'}
            onClick={() => setEditorState(s => ({ ...s, readOnly: !s.readOnly }))}
          />
        )}
        <IconWithPopover
          padding={10}
          renderOnParent={false}
          align={'end'}
          placement={['bottom']}
          size={16}
          content={
            <WithBorder width={180}>
              <EditorSetting editor={editor} />
            </WithBorder>
          }
          name={'park-more'}
          className={ClassName.flatButton(4, '5px')}
        />
      </Content>
    </Content>
  )
}

export default EditorHeader
