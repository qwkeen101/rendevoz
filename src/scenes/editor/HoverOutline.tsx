import { Content, Icon, TabPane, Tabs } from '@/components'
import { motion } from 'framer-motion'
import Outliner from '@/core/editor/utils/outline/outliner'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useRef, useState } from 'react'
import { Descendant } from 'slate'
import { CustomEditor } from '~/typings'
import AllHighlights from './AllHighlights'
import AllObjects from './AllObjects'
import { EditorHeadingTreeAtom, useEditorFilter } from './useEditorFilter'
import { useAtomValue } from 'jotai'
import { goToBlock, highlightBlock } from '@/core/editor/utils'
type IHeadingTreeNode = ReturnType<typeof Outliner.headingListToTree>
const SidebarToolbar = ({ value, editor }: { value: Descendant[]; editor: CustomEditor }) => {
  const [collapsed, toggleCollapsed] = useToggle(true)
  useEditorFilter(editor)
  const [width, setWidth] = useState(250)
  const sidebarRef = useRef<HTMLDivElement>(null)
  return (
    <>
      {collapsed && (
        <Icon
          onClick={toggleCollapsed}
          name="park-hamburger-button"
          size={18}
          containerStyle={{
            position: 'absolute',
            left: 15,
            top: 40,
            zIndex: 10
          }}
          className={ClassName.circleButton()}
        />
      )}
      <div
        ref={sidebarRef}
        style={{
          position: 'absolute',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease',
          padding: '6px 18px',
          borderRadius: 10,
          gap: 10,
          width,
          height: 'calc(100% - 60px)',
          top: 15,
          left: collapsed ? -width : 30,
          maxWidth: 350,
          minWidth: 200
        }}
        className={ClassName.Background.pseudoBlubBackground}
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
              onClick={toggleCollapsed}
              className={ClassName.circleButton()}
            />
          }
        >
          <TabPane
            key="1"
            tab="目录"
            style={{
              paddingTop: 10
            }}
          >
            <HeadingTree value={value} editor={editor} />
          </TabPane>
          <TabPane
            key="2"
            tab="高亮"
            style={{
              paddingTop: 10
            }}
          >
            <AllHighlights editor={editor} />
          </TabPane>
          <TabPane
            key="3"
            tab="实体"
            style={{
              paddingTop: 10
            }}
          >
            <AllObjects editor={editor} />
          </TabPane>
        </Tabs>
        <motion.div
          drag="x"
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          onDrag={(e, info) => {
            const sidebar = sidebarRef.current
            if (sidebar) {
              sidebar.style.transition = 'none'
              sidebar.style.width = `${width + info.offset.x}px`
            }
          }}
          onDragEnd={() => {
            if (sidebarRef.current) {
              const width = parseInt(sidebarRef.current.style.width)
              setWidth(Math.min(Math.max(200, width), 350))
              sidebarRef.current.style.transition = 'all 0.2s ease'
            }
          }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 5,
            cursor: 'col-resize'
          }}
        ></motion.div>
      </div>
    </>
  )
}
const HeadingTree = ({ editor }: { value: Descendant[]; editor: CustomEditor }) => {
  const headingTree = useAtomValue(EditorHeadingTreeAtom)
  return (
    <>
      {headingTree && (
        <Content flex column gap={4} style={{ height: '100%', overflowY: 'auto', paddingLeft: 15, overflowX: 'hidden', paddingRight: 20 }}>
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
          }}
          className={css([
            {
              transition: 'color 0.2s ease',
              ':hover': {
                color: '#8ab4f8'
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
