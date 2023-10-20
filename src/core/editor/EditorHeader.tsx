import useEditorInstance from '@/core/editor/hooks/useEditorInstance'
import { Button, Content, Icon, IconWithPopover, Slider, Switch, WithBorder } from '@/components'
import UseEditorBarState from '@/core/editor/hooks/useEditorBarState'
import useEditorState from '@/core/editor/hooks/useEditorState'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import { slateToMarkdown } from '@/core/editor/plugins/slateToMarkdown'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import { DateFormat } from '@/utils'
import { Colors } from '@/consts'
import { CustomEditor } from '~/typings'
import EditorSetting from '@/core/editor/components/setting/EditorSetting'
import translateWholePage from '@/core/editor/utils/translateWholePage'

const EditorHeader = ({ title, editor }: { editor: CustomEditor; title: string }) => {
  const instance = useEditorInstance()
  const [, setEditorBarState] = UseEditorBarState()
  const [editorState, setEditorState] = useEditorState()
  const { t } = useTranslation()
  const { lastSavedAt } = editorState.state || {}
  const { readOnly, header } = editorState

  return (
    <Content
      flex
      alignItems="center"
      style={{
        padding: '6px 16px',
        background: Colors.Background.Secondary,
        borderBottom: `1px solid ${Colors.Background.Border}`
      }}
      gap={30}
      justifyContent="space-between"
    >
      <Content flex alignItems={'center'} gap={8}>
        {header?.leftExtra}
        {header?.display?.leftbar !== false && (
          <Icon
            size={16}
            className={ClassName.flatButton(4, '4px')}
            name={'custom-left-bar'}
            onClick={() => setEditorBarState(s => ({ ...s, showLeftBar: !s.showLeftBar }))}
          />
        )}
        {header?.display?.title !== false && (
          <div style={{ textTransform: 'none', marginLeft: 4 }} className={css([ClassName.title('0.9rem'), ClassName.ellipsisFont(1)])}>
            {title}
          </div>
        )}

        {lastSavedAt && (
          <div style={{ fontSize: 12, marginLeft: 8, color: Colors.Font.Transparent, flexShrink: 0 }}>
            {t('general.Last saved at')}: {DateFormat.format(lastSavedAt, DateFormat.Formats.withSecond)}
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
          <Icon name={'park-find'} onClick={() => instance.searchOps?.toggleSearch()} className={ClassName.flatButton(4, '4px')} />
        )}
        {header?.display?.label !== false && (
          <Icon name={'park-label'} onClick={() => instance.labelOps?.toggleLabel()} className={ClassName.flatButton(4, '4px')} />
        )}
        <IconWithPopover
          disableNudge={true}
          padding={10}
          renderOnParent={false}
          align={'end'}
          placement={['bottom']}
          content={
            <WithBorder padding={6} style={{ minWidth: 160, fontSize: FontSize['13px'] }}>
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
