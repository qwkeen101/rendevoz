import { Content, Icon, TabPane, Tabs, Tooltip } from '@/components'
import Outliner from '@/core/components/editor/utils/outline/outliner'
import { useSelectAtomValue, useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useRef } from 'react'
import { Descendant } from 'slate'
import { CustomEditor } from '~/typings'
import AllObjects from './AllObjects'
import { EditorHeadingTreeAtom, useEditorFilter } from './useEditorFilter'
import { useAtomValue, useSetAtom } from 'jotai'
import { goToBlock, highlightBlock } from '@/core/components/editor/utils'
import { useTranslation } from 'react-i18next'
import { Resizable } from 're-resizable'
import Colors from '@/consts/colors'
import useEditorValue from '@/core/components/editor/hooks/useEditorValue'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import UseEditorBarState from '@/core/components/editor/hooks/useEditorBarState'

type IHeadingTreeNode = ReturnType<typeof Outliner.headingListToTree>
const SidebarToolbar = ({ editor }: { editor: CustomEditor }) => {
  const [editorBarState, setEditorBarState] = UseEditorBarState()
  const value = useEditorValue()
  useEditorFilter(editor)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const collapsed = !editorBarState.showLeftBar
  const headingTree = useAtomValue(EditorHeadingTreeAtom)
  if (!headingTree?.children.length) return null
  return (
    <>
      {editorBarState.showLeftBar === false && (
        <Tooltip content={'Show contents'}>
          <Icon
            name={'park-align-text-left'}
            size={18}
            containerStyle={{
              position: 'absolute',
              top: 58,
              left: 10,
              zIndex: 99
            }}
            onClick={() => setEditorBarState(s => ({ ...s, showLeftBar: true }))}
            className={ClassName.flatButton(4, '4px')}
          />
        </Tooltip>
      )}
      <Resizable
        enable={{ right: true }}
        minWidth={120}
        maxWidth={500}
        defaultSize={{
          width: '300px',
          height: 'auto'
        }}
        ref={sidebarRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 50,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.27s ease, opacity 0.27s ease',
          padding: '8px',
          gap: 4,
          height: '100%',
          background: Colors.Background.Global,
          pointerEvents: collapsed ? 'none' : 'auto',
          transform: collapsed ? 'translateX(-100%)' : 'translateX(0px)',
          opacity: collapsed ? 0 : 1,
          // background: Colors.Background.Secondary,
          boxShadow: Colors.Background.BoxShadow,
          minHeight: 120,
          alignItems: 'flex-start',
          borderRadius: '0px 8px 8px 0px',
          paddingBottom: 60,
          fontSize: 14
        }}
      >
        <Icon
          size={18}
          name={'park-double-left'}
          className={ClassName.flatButton(4, '4px')}
          onClick={() => setEditorBarState(s => ({ ...s, showLeftBar: false }))}
        />
        <HeadingTree value={value} editor={editor} />
      </Resizable>
    </>
  )
}

const HeadingTree = ({ editor }: { value: Descendant[]; editor: CustomEditor }) => {
  const headingTree = useAtomValue(EditorHeadingTreeAtom)
  return (
    <>
      {headingTree && (
        <Content
          flex
          column
          gap={4}
          style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: 10
          }}
        >
          {headingTree.children.map(i => (
            <HeadingItem
              item={i}
              key={i.id}
              onClick={headingId => {
                goToBlock(headingId, editor).then(() => {
                  highlightBlock(headingId, editor)
                })
              }}
            />
          ))}
        </Content>
      )}
    </>
  )
}
const HeadingItem = ({ item, onClick }: { item: IHeadingTreeNode; onClick: (headingId: number) => void }) => {
  const [collapsed, toggleCollapsed] = useToggle(false)
  const setEditorState = useSetAtom(EditorStateAtom)
  const currentActiveHeadingId = useSelectAtomValue(EditorStateAtom, s => s.currentActiveHeadingId)
  return (
    <Content flex column gap={4}>
      <Content flex gap={6} style={{ cursor: 'pointer' }}>
        {item.children.length > 0 && (
          <Icon
            theme={'filled'}
            name="park-right-one"
            containerStyle={{
              transform: collapsed ? undefined : 'rotate(90deg)',
              transition: 'all 0.2s ease'
            }}
            onClick={toggleCollapsed}
          />
        )}
        <div
          onClick={() => {
            onClick(item.id)
            setEditorState(s => ({ ...s, currentActiveHeadingId: item.id }))
          }}
          style={{
            textTransform: 'none',
            fontWeight: 500,
            transition: 'color 0.2s ease',
            color: currentActiveHeadingId === item.id ? Colors.Common.SelectColor : undefined
          }}
          className={css([
            ClassName.ellipsisFont(1),
            {
              ':hover': {
                color: Colors.Common.SelectColor
              }
            }
          ])}
        >
          {item.text}
        </div>
      </Content>
      {item.children.length > 0 && (
        <Content flex column style={{ paddingLeft: 10, display: collapsed ? 'none' : 'flex' }} gap={4}>
          {item.children.map(i => (
            <HeadingItem item={i} key={i.id} onClick={onClick} />
          ))}
        </Content>
      )}
    </Content>
  )
}
export default SidebarToolbar
