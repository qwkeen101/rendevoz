import { Content, Icon } from '@/components'
import Outliner from '@/core/components/editor/utils/outline/outliner'
import { useSelectAtomValue, useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { Descendant } from 'slate'
import { CustomEditor } from '~/typings'
import { EditorHeadingTreeAtom, useEditorFilter } from './useEditorFilter'
import { useAtomValue, useSetAtom } from 'jotai'
import { goToBlock, highlightBlock } from '@/core/components/editor/utils'
import useEditorValue from '@/core/components/editor/hooks/useEditorValue'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { memo, useMemo } from 'react'
import classnames from 'classnames'

type IHeadingTreeNode = ReturnType<typeof Outliner.headingListToTree>
const SidebarContents = memo(({ editor }: { editor: CustomEditor }) => {
  const value = useEditorValue()
  useEditorFilter(editor)
  const headingTree = useAtomValue(EditorHeadingTreeAtom)
  if (!headingTree?.children.length)
    return (
      <div
        className={'bold-font transparent-font'}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        No content
      </div>
    )
  return <HeadingTree value={value} editor={editor} />
})

const HeadingTree = ({ editor }: { value: Descendant[]; editor: CustomEditor }) => {
  const headingTree = useAtomValue(EditorHeadingTreeAtom)
  return (
    headingTree && (
      <Content
        flex
        column
        gap={3}
        style={{
          height: '100%',
          width: '100%',
          padding: '10px 10px 100px',
          overflow: 'hidden auto'
        }}
      >
        {headingTree.children.map(i => (
          <HeadingItem
            item={i}
            key={i.id}
            onClick={headingId => {
              goToBlock(headingId, editor, 'start').then(() => {
                highlightBlock(headingId, editor)
              })
            }}
          />
        ))}
      </Content>
    )
  )
}
const HeadingItem = memo(
  ({ item, onClick }: { item: IHeadingTreeNode; onClick: (headingId: number) => void }) => {
    const [collapsed, toggleCollapsed] = useToggle(true)
    const setEditorState = useSetAtom(EditorStateAtom)
    const currentActiveHeadingId = useSelectAtomValue(EditorStateAtom, s => s.currentActiveHeadingId)
    let contains = currentActiveHeadingId === item.id
    if (!contains && collapsed) {
      const loop = (i: IHeadingTreeNode) => {
        if (i.children.some(c => c.id === currentActiveHeadingId)) {
          contains = true
          return
        } else {
          i.children.forEach(o => loop(o))
        }
      }
      loop(item)
    }
    return (
      <Content flex column gap={3}>
        <Content
          flex
          gap={6}
          onClick={() => {
            onClick(item.id)
            setEditorState(s => ({ ...s, currentActiveHeadingId: item.id }))
          }}
          style={{ cursor: 'pointer' }}
          className={classnames(contains && 'active-button', ClassName.flatButton(4, '4px 8px'), 'font-size-14')}
        >
          {item.children.length > 0 && (
            <Icon
              name="park-right"
              containerStyle={{
                transform: collapsed ? undefined : 'rotate(90deg)',
                transition: 'all 0.2s ease'
              }}
              onClick={e => {
                e.stopPropagation()
                toggleCollapsed()
              }}
            />
          )}
          <div
            style={{
              textTransform: 'none',
              transition: 'color 0.2s ease'
            }}
            className={'ellipsis-font-1'}
          >
            {item.text}
          </div>
        </Content>
        {item.children.length > 0 && (
          <Content flex column style={{ paddingLeft: 20, display: collapsed ? 'none' : 'flex' }} gap={4}>
            {item.children.map(i => (
              <HeadingItem item={i} key={i.id} onClick={onClick} />
            ))}
          </Content>
        )}
      </Content>
    )
  },
  (prev, curr) => prev.item === curr.item
)
export default SidebarContents
