import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { Content, Icon, IconWithPopover, WithBorder } from '@/components'
import UseEditorBarState from '@/core/components/editor/hooks/useEditorBarState'
import useEditorState from '@/core/components/editor/hooks/useEditorState'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import { css } from '@emotion/css'
import { CustomEditor } from '~/typings'
import EditorSetting from '@/core/components/editor/components/setting/EditorSetting'
import classnames from 'classnames'

const EditorHeader = ({ title, editor, maxTitleWidth }: { editor: CustomEditor; title: string; maxTitleWidth?: number | string }) => {
  const instance = useEditorInstance()
  const [barState, setEditorBarState] = UseEditorBarState()
  const [editorState, setEditorState] = useEditorState()
  const { readOnly, header } = editorState

  return (
    <Content
      flex
      alignItems="center"
      style={{
        padding: '6px 8px 6px 8px',
        top: 0,
        zIndex: 99
      }}
      position={'sticky'}
      gap={30}
      justifyContent="space-between"
    >
      <Content
        flex
        alignItems={'center'}
        gap={8}
        style={{
          maxWidth: maxTitleWidth
        }}
      >
        {header?.leftExtra}
        {header?.display?.title !== false && (
          <div style={{ marginLeft: 4 }} className={'ellipsis-font-1 font-size-14'}>
            {title}
          </div>
        )}
      </Content>
      <Content flex gap={8}>
        {header?.rightExtra}
        {header?.display?.modeSwitcher !== false && (
          <Icon
            className={ClassName.flatButton(4, '4px')}
            name={readOnly ? 'park-edit' : 'park-book-open'}
            onClick={() => setEditorState(s => ({ ...s, readOnly: !s.readOnly }))}
          />
        )}
        {header?.display?.search !== false && (
          <Icon
            name={'park-find'}
            onClick={() => instance.searchOps?.toggleSearch()}
            className={classnames(
              ClassName.flatButton(4, '4px'),
              barState.rightBarActive === 'search' && barState.showRightBar === true && 'active-button'
            )}
          />
        )}
        {header?.display?.label !== false && (
          <Icon
            name={'park-label'}
            onClick={() => instance.labelOps?.toggleLabel()}
            className={classnames(
              ClassName.flatButton(4, '4px'),
              barState.rightBarActive === 'label' && barState.showRightBar === true && 'active-button'
            )}
          />
        )}
        <Icon
          name={'custom-stars'}
          onClick={() => {
            setEditorBarState(s => ({
              ...s,
              rightBarActive: 'ai',
              showRightBar: s.rightBarActive === 'ai' ? !s.showRightBar : true
            }))
          }}
          className={classnames(
            ClassName.flatButton(4, '4px'),
            barState.rightBarActive === 'ai' && barState.showRightBar === true && 'active-button'
          )}
        />
        <IconWithPopover
          disableNudge={true}
          padding={10}
          renderOnParent={false}
          align={'end'}
          placement={['bottom']}
          content={
            <WithBorder style={{ minWidth: 180, fontSize: FontSize['13px'] }}>
              <EditorSetting editor={editor} />
            </WithBorder>
          }
          name={'park-more'}
          className={ClassName.circleButton(3, 4)}
        />
      </Content>
    </Content>
  )
}

export default EditorHeader
