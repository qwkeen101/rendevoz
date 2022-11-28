import { Noop } from '@/common/types'
import { AnimatePopover, Content, WithBorder } from '@/components/base'
import { PosHelper } from '@/components/contextMenu'
import EditorElementsMenu from '@/components/menus/EditorElementsMenu'
import EmojiPicker from '@/components/picker/emojiPicker'
import { KEY } from '@/consts/key'
import { EditorEventHandler } from '@/events/editorEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useDebounceFn, useMemoizedFn, useRafFn } from '@/hooks'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import useMetaStore from '@/stores/meta.store'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import fuzzysort from 'fuzzysort'
import { FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Editor, Node, Range, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { MetaKnowledgeObject, MetaLink } from '~/typings/data'
import { CustomEditor } from '../../customTypes'
import { scrollToTarget } from '../../utils/positions/scroll'
import { EditorSelectArea, SELECT_AREA_MAP } from '../../weakMaps'

interface OverlayProps {
  visible: boolean
  onVisiblityChange: (visiblity: boolean) => void
  editor: CustomEditor
  scrollElement?: HTMLElement | null
  onAddMetaObject: Noop
}
type Position = {
  left?: number
  top?: number
}
const EditorOverlay: FC<OverlayProps> = ({ visible, onVisiblityChange, editor, scrollElement, onAddMetaObject }) => {
  const [position, setPosition] = useState<Position>()
  const [content, setContent] = useState<'blockHandleMenu' | 'emojiPicker' | 'metaObject'>()
  const [selectArea, setSelectArea] = useState<EditorSelectArea>()
  const [metaQuery, setMetaQuery] = useState('')
  const { addMetaObject, addMetaLink } = useMetaStore()
  const emitter = useEventEmitter()
  const noteIdRef = useRef<number>()
  const handler = new EditorEventHandler()
  const metaObjectRef = useRef<Node | null>(null)

  handler.on('toggleOverlay', data => {
    noteIdRef.current = data.noteId
    if (data.content === 'selectArea') {
      const selectArea = SELECT_AREA_MAP.get(editor)
      if (selectArea && scrollElement) {
        const width = selectArea.right - selectArea.left
        const height = selectArea.bottom - selectArea.top
        const scrollElementRect = scrollElement.getBoundingClientRect()
        const left = scrollElementRect.left + selectArea.left
        const top = scrollElementRect.top + selectArea.top - scrollElement.scrollTop
        setSelectArea({
          width,
          height,
          left,
          top
        })
      } else {
        setSelectArea(undefined)
      }
      return
    }
    if (data.content === 'metaObject') {
      const { selection } = editor
      if (selection) {
        const [domNode] = ReactEditor.toDOMPoint(editor, selection.focus)
        metaObjectRef.current = domNode.parentNode
        const domRange = ReactEditor.toDOMRange(editor, selection)
        const rect = domRange.getBoundingClientRect()
        setPosition({
          top: rect.top,
          left: rect.left
        })
        window.getSelection()?.addRange(domRange)
        console.log(editor.selection)
        setContent('metaObject')
        document.addEventListener('keyup', handleMetaObjectKeywordChange)
        document.addEventListener('keydown', handleMetaObjectKeywordChange)
        onVisiblityChange(true)
        return
      }
    }
    setPosition({ top: data.top, left: data.left })
    setContent(data.content)
    onVisiblityChange(true)
  })
  const handleMetaObjectKeywordChange = useMemoizedFn((e: KeyboardEvent) => {
    const keyword = metaObjectRef.current?.textContent?.replace('$ ', '') || ''
    if ((e.key === KEY.Delete || e.key === KEY.Backspace) && e.type === 'keyup') {
      const node = Editor.above(editor)
      if (node) {
        const text = Node.string(node[0])
        if (text.at(0) !== '$') {
          onVisiblityChange(false)
          document.removeEventListener('keyup', handleMetaObjectKeywordChange)
          document.removeEventListener('keydown', handleMetaObjectKeywordChange)
          return
        }
      }
    }
    if (e.key === KEY.Enter) {
      e.preventDefault()
      e.stopPropagation()
      const { selection } = editor
      if (!selection || !Range.isCollapsed(selection)) return
      Transforms.removeNodes(editor)
      const metaId = Id.getId()
      Transforms.insertNodes(editor, {
        type: 'paragraph',
        id: Id.getId(),
        children: [
          {
            type: 'metaObject',
            id: metaId,
            children: [{ text: keyword }]
          }
        ]
      })
      addMetaObject({
        keyword
      }).then(obj => {
        const node = Editor.above(editor, {
          match: n => Editor.isVoid(editor, n) && n.id === metaId
        })
        addLink(obj.id)
        if (!node) return
        Transforms.setNodes(editor, { originId: obj.id }, { at: node[1], voids: true })
      })
      onVisiblityChange(false)
      document.removeEventListener('keyup', handleMetaObjectKeywordChange)
      document.removeEventListener('keydown', handleMetaObjectKeywordChange)
      return
    }
    if (e.type === 'keydown') return
    setMetaQuery(keyword)
  })
  const handleMetaObjectClick = (obj: MetaKnowledgeObject) => {
    onVisiblityChange(false)
    document.removeEventListener('keyup', handleMetaObjectKeywordChange)
    document.removeEventListener('keydown', handleMetaObjectKeywordChange)
    Transforms.removeNodes(editor)
    Transforms.insertNodes(editor, {
      type: 'paragraph',
      id: Id.getId(),
      children: [
        {
          type: 'metaObject',
          id: Id.getId(),
          originId: obj.id,
          children: [{ text: obj.keyword }]
        }
      ]
    })
    addLink(obj.id)
  }
  const addLink = (knowledgeId: number) => {
    const noteId = editor.noteId
    if (noteId) {
      const link: Partial<MetaLink> = {
        id: Id.getId(),
        targetId: knowledgeId,
        targetType: 'knowlege',
        sourceType: 'note',
        sourceId: noteId,
        label: 'from'
      }
      addMetaLink(link)
    }
  }
  useEffect(() => {
    emitter.addListener('editor', handler)
    return () => {
      emitter.removeListener('editor', handler)
    }
  })

  const positions = (): string[] => {
    switch (content) {
      case 'blockHandleMenu':
        return ['left', 'right']
      case 'emojiPicker':
        return ['bottom']
      default:
        return ['bottom']
    }
  }
  if (selectArea) {
    return createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        {selectArea && <div style={{ ...selectArea, background: 'rgba(0,0,0,0.06)', position: 'absolute', borderRadius: 10 }}></div>}
      </div>,
      document.body,
      'editorOverlay'
    )
  }
  return (
    <AnimatePopover
      positions={positions()}
      padding={20}
      onClickOutside={() => {
        onVisiblityChange(false)
        document.removeEventListener('keyup', handleMetaObjectKeywordChange)
        document.removeEventListener('keydown', handleMetaObjectKeywordChange)
      }}
      visible={visible}
      disableNudge
      disableIntersection
      align={content === 'metaObject' ? 'start' : 'center'}
      content={
        <>
          {content === 'blockHandleMenu' && (
            <WithBorder>
              <EditorElementsMenu onAddMetaObject={onAddMetaObject} />
            </WithBorder>
          )}
          {content === 'emojiPicker' && (
            <WithBorder>
              <EmojiPicker
                onPick={name => {
                  emitter.emit('editor', {
                    type: 'insertNode',
                    data: {
                      element: {
                        type: 'emoji',
                        name,
                        children: [{ text: '' }]
                      }
                    }
                  })
                }}
              />
            </WithBorder>
          )}
          {content === 'metaObject' && (
            <WithBorder>
              <MetaQueryCard onMetaObjectClick={handleMetaObjectClick} query={metaQuery} />
            </WithBorder>
          )}
        </>
      }
    >
      <PosHelper {...position}></PosHelper>
    </AnimatePopover>
  )
}

const MetaQueryCard = ({ query, onMetaObjectClick }: { query: string; onMetaObjectClick: (obj: MetaKnowledgeObject) => void }) => {
  const { searchMetaObject } = useMetaStore()
  const [metaObjects, setMetaObjects] = useState<MetaKnowledgeObject[]>([])
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const objectsContainerRef = useRef<HTMLDivElement>(null)

  const handleSearch = () => {
    const results = searchMetaObject(query)
    setMetaObjects(results.map(i => i.obj))
    setSelectedIdx(-1)
  }
  const { run: debouncedSearch } = useDebounceFn(handleSearch, { wait: 100 })
  const handleKeyDown = useMemoizedFn((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      selectedIdx >= 0 && onMetaObjectClick(metaObjects[selectedIdx])
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      setSelectedIdx(idx => Math.max(0, idx - 1))
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      setSelectedIdx(idx => Math.min(idx + 1, metaObjects.length - 1))
    }
  })
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])
  useEffect(() => {
    const container = objectsContainerRef.current
    if (container && selectedIdx) {
      const target = container.children[selectedIdx] as HTMLElement
      if (!target) return
      if (target.offsetTop > container.clientHeight - target.clientHeight || target.offsetTop - container.scrollTop < 0) {
        target.scrollIntoView()
      }
    }
  }, [selectedIdx])
  useEffect(() => {
    debouncedSearch()
  }, [query])
  return (
    <Content flex column style={{ minHeight: 150, width: 200, padding: 5 }}>
      {metaObjects.length > 0 ? (
        <Content ref={objectsContainerRef} flex column style={{ maxHeight: 350, overflowY: 'auto' }}>
          {metaObjects?.map((i, idx) => (
            <div
              onClick={() => onMetaObjectClick(i)}
              className={css({
                padding: '6px 12px',
                // transition: 'all 0.2s ease',
                cursor: 'pointer',
                borderRadius: 4,
                wordBreak: 'break-all',
                background: selectedIdx === idx ? 'rgba(0,0,0,0.07)' : undefined,
                ':hover': {
                  background: 'rgba(0,0,0,0.07)'
                }
              })}
            >
              {i.keyword}
            </div>
          ))}
        </Content>
      ) : (
        'Type to search meta objects.'
      )}
    </Content>
  )
}
export default EditorOverlay
