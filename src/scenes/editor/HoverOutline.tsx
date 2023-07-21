import { Content, Icon, TabPane, Tabs } from '@/components'
import Outliner from '@/core/editor/utils/outline/outliner'
import { useSelectAtomValue, useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useRef } from 'react'
import { Descendant } from 'slate'
import { CustomEditor } from '~/typings'
import AllObjects from './AllObjects'
import { EditorHeadingTreeAtom, useEditorFilter } from './useEditorFilter'
import { useAtomValue, useSetAtom } from 'jotai'
import { goToBlock, highlightBlock } from '@/core/editor/utils'
import { useTranslation } from 'react-i18next'
import { Resizable } from 're-resizable'
import Colors from '@/consts/colors'
import useEditorValue from '@/core/editor/hooks/useEditorValue'
import { EditorStateAtom } from '@/core/editor/hooks/useEditorState'
import UseEditorBarState from '@/core/editor/hooks/useEditorBarState'

type IHeadingTreeNode = ReturnType<typeof Outliner.headingListToTree>
const SidebarToolbar = ({ editor }: { editor: CustomEditor }) => {
  const [editorBarState, setEditorBarState] = UseEditorBarState()
  const value = useEditorValue()
  useEditorFilter(editor)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const collapsed = !editorBarState.showLeftBar
  return (
    <Resizable
      enable={{ right: true }}
      minWidth={200}
      maxWidth={500}
      defaultSize={{
        width: '300px',
        height: '100%'
      }}
      handleStyles={{
        right: {
          width: 3,
          background: Colors.Background.Border
        }
      }}
      ref={sidebarRef}
      style={{
        position: collapsed ? 'absolute' : 'relative',
        left: 0,
        top: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease',
        padding: '6px 8px 6px 12px',
        gap: 10,
        height: '100%',
        pointerEvents: collapsed ? 'none' : 'auto',
        transform: collapsed ? 'translateX(-100%) translateX(-10px)' : 'translateX(0px)'
      }}
    >
      <Tabs
        defaultActiveKey="1"
        extra={
          <Icon
            size={18}
            name="park-left"
            containerStyle={{
              width: 'fit-content'
            }}
            onClick={() => setEditorBarState(s => ({ ...s, showLeftBar: false }))}
            className={ClassName.circleButton()}
          />
        }
      >
        <TabPane
          key="1"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-view-list" />
              {t('general.outline')}
            </Content>
          }
          style={{
            paddingTop: 10
          }}
        >
          <HeadingTree value={value} editor={editor} />
        </TabPane>
        <TabPane
          key="3"
          tab={
            <Content alignItems="center" flex gap={6}>
              <Icon name="park-share-one" />
              {t('general.object')}
            </Content>
          }
          style={{
            paddingTop: 10
          }}
        >
          <AllObjects editor={editor} />
        </TabPane>
      </Tabs>
    </Resizable>
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
            paddingLeft: 15,
            overflowX: 'hidden',
            paddingRight: 20
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
      <div
        className={css({
          position: 'relative',
          cursor: 'pointer'
        })}
      >
        {item.children.length > 0 && (
          <Icon
            name="park-right"
            containerStyle={{
              position: 'absolute',
              left: -18,
              top: '50%',
              transform: collapsed ? 'translateY(-50%)' : 'rotate(90deg) translateY(-50%)',
              transition: 'all 0.2s ease',
              transformOrigin: 'top'
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
            fontWeight: currentActiveHeadingId === item.id ? 700 : undefined
          }}
          className={css([
            {
              fontWeight: 400,
              ':hover': {
                fontWeight: 700
              }
            },
            ClassName.ellipsisFont(1)
          ])}
        >
          {item.text}
        </div>
      </div>
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
