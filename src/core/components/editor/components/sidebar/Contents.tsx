import { Icon } from '@/components'
import { useSelectAtomValue, useToggle } from '@/hooks'
import { CustomEditor, CustomElement } from '~/typings'
import { useSetAtom } from 'jotai'
import { goToBlock, highlightBlock } from '@/core/components/editor/utils'
import { EditorStateAtom, useSetEditorState } from '@/core/components/editor/hooks/useEditorState'
import { memo, useEffect, useState } from 'react'
import classnames from 'classnames'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import EmptyList from '@/core/components/common/EmptyList'
import { debounce } from 'lodash'
import { Node } from 'slate'
import { getElementId } from '@/utils'

interface HeadingTreeNode {
  id: number
  text?: string
  children: HeadingTreeNode[]
  level: number
  isOpen?: boolean
}
const SidebarContents = memo(() => {
  const instance = useEditorInstance()
  const editor = instance.editor
  const setState = useSetEditorState()
  const scrollElementRef = instance.values.scrollElementRef
  const [headingTree, setHeadingTree] = useState<HeadingTreeNode>()
  const handleValueChange = () => {
    setHeadingTree({ ...calculateContents(editor.children as CustomElement[]), id: 0 })
  }

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    const debounceCheck = debounce(() => {
      if (scrollElement) {
        const scrollBounding = scrollElement.getBoundingClientRect()
        const headingElements = scrollElement.querySelectorAll('.HeadingBlock')
        let closest: Element | null = null
        let minDistance = Infinity
        headingElements.forEach(h => {
          const rect = h.getBoundingClientRect()
          const distance = Math.abs(rect.top - scrollBounding.top)
          // 30 = header height
          if (rect.top - scrollBounding.top >= 30 && distance < minDistance) {
            closest = h
            minDistance = distance
          }
        })
        if (closest) {
          const id = getElementId(closest)
          setState(s => ({ ...s, currentActiveHeadingId: id }))
        }
      }
    }, 300)
    const scrollListener = () => debounceCheck()
    instance.addEventListener('valueChange', handleValueChange)
    handleValueChange()
    if (scrollElement) {
      scrollElement.addEventListener('scroll', scrollListener)
    }
    return () => {
      instance.removeEventListener('valueChange', handleValueChange)
      scrollElement?.removeEventListener('scroll', scrollListener)
    }
  }, [])
  if (!headingTree?.children.length) return <EmptyList className={'h-full'} />
  return <HeadingTree tree={headingTree} editor={editor} />
})

const HeadingTree = ({ editor, tree }: { editor: CustomEditor; tree: HeadingTreeNode }) => {
  return (
    <div className={'w-full pt-3 px-3 pb-40 h-full overflow-x-hidden overflow-y-auto flex flex-col'}>
      {tree.children.map(i => (
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
    </div>
  )
}
const HeadingItem = memo(
  ({ item, onClick }: { item: HeadingTreeNode; onClick: (headingId: number) => void }) => {
    const setEditorState = useSetAtom(EditorStateAtom)
    const currentActiveHeadingId = useSelectAtomValue(EditorStateAtom, s => s.currentActiveHeadingId)
    const contains = currentActiveHeadingId === item.id
    return (
      <div className={'flex flex-col'}>
        <div
          onClick={() => {
            onClick(item.id)
            setEditorState(s => ({ ...s, currentActiveHeadingId: item.id }))
          }}
          className={classnames(contains && 'active-button', 'button items-center flex gap-2')}
        >
          <div className={'transparent-font font-size-13 font-semibold'}>H{item.level}</div>
          <div className={'line-clamp-1'}>{item.text}</div>
        </div>
        {item.children.length > 0 && (
          <div className={'pl-4 flex flex-col'}>
            {item.children.map(i => (
              <HeadingItem item={i} key={i.id} onClick={onClick} />
            ))}
          </div>
        )}
      </div>
    )
  },
  (prev, curr) => prev.item === curr.item
)

const headingType = ['heading-one', 'heading-two', 'heading-three', 'heading-four', 'heading-five']

const calculateContents = (children: CustomElement[]) => {
  const headingList = children.filter(i => {
    return headingType.includes(i.type)
  })
  const newList = headingList.map(i => {
    const str = Node.string(i)
    switch (i.type) {
      case 'heading-one':
        return {
          level: 1,
          id: i.id,
          text: str
        }
      case 'heading-two':
        return {
          level: 2,
          id: i.id,
          text: str
        }
      case 'heading-three':
        return {
          level: 3,
          id: i.id,
          text: str
        }
      case 'heading-four':
        return {
          level: 4,
          id: i.id,
          text: str
        }
      case 'heading-five':
        return {
          level: 5,
          id: i.id,
          text: str
        }
      case 'heading-six':
        return {
          level: 6,
          id: i.id,
          text: str
        }
    }
  })
  const stack = [{ level: 0, children: [], isOpen: true }]
  newList.forEach(h => {
    if (h) {
      const self = {
        text: h.text,
        id: h.id,
        children: [],
        level: h.level,
        isOpen: true
      }
      while (self.level <= stack[stack.length - 1].level) stack.pop()
      stack[stack.length - 1].children.push(self)
      stack.push(self)
    }
  })
  return stack[0]
}

export default SidebarContents
