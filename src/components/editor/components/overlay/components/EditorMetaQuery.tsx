import { Content, WithBorder } from '@/components/base'
import { CustomEditor } from '@/components/editor/types'
import { Positions } from '@/components/editor/utils/positions'
import { KEY } from '@/consts/key'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import Id from '@/utils/id'
import { css } from '@emotion/css'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Editor, Node, Range, Transforms } from 'slate'
import { ReactEditor } from '../../../slate-react'
import { MetaKnowledgeObject, MetaLink } from '~/typings/data'
import { EditorOverlayManager } from '../useEditorOverlay'

const EditorMetaQuery = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const [query, setQuery] = useState<string>('')
  const { addMetaObject, addMetaLink, getMetaObjectByNoteId } = useMetaStore()
  const targetNodeRef = useRef<HTMLElement>()
  useLayoutEffect(() => {
    const { selection } = editor
    if (selection) {
      const [domNode] = ReactEditor.toDOMPoint(editor, selection.focus)
      targetNodeRef.current = domNode.parentNode as HTMLElement
      const domRange = ReactEditor.toDOMRange(editor, selection)
      const rect = domRange.getBoundingClientRect()
      manager.setPosition({
        left: rect.left + 90,
        top: rect.top + 10
      })
      ReactEditor.focus(editor)
      window.getSelection()?.setPosition(domNode, 2)
      window.getSelection()?.addRange(domRange)
    }
  }, [])
  useEffect(() => {
    document.addEventListener('keydown', handleKeywordChange)
    document.addEventListener('keyup', handleKeywordChange)
    return () => {
      document.removeEventListener('keydown', handleKeywordChange)
      document.removeEventListener('keyup', handleKeywordChange)
    }
  })
  const handleKeywordChange = useMemoizedFn((e: KeyboardEvent) => {
    const keyword = targetNodeRef.current?.textContent?.replace('$ ', '') || ''
    if ((e.key === KEY.Delete || e.key === KEY.Backspace) && e.type === 'keyup') {
      const node = Editor.above(editor)
      if (node) {
        const text = Node.string(node[0])
        if (text.at(0) !== '$') {
          manager.close()
          document.removeEventListener('keyup', handleKeywordChange)
          document.removeEventListener('keydown', handleKeywordChange)
          return
        }
      }
    }
    if (e.key === KEY.Enter && e.type === 'keydown') {
      e.preventDefault()
      e.stopPropagation()
      const { selection } = editor
      if (!selection || !Range.isCollapsed(selection)) return
      const parentBlock = Positions.parentBlock(editor)
      if (!parentBlock) return
      const metaId = Id.getId()
      const paraId = Id.getId()
      Transforms.removeNodes(editor, { at: parentBlock[1] })
      Transforms.insertNodes(
        editor,
        {
          type: 'paragraph',
          id: paraId,
          children: [
            {
              type: 'metaObject',
              id: metaId,
              children: [{ text: keyword }]
            }
          ]
        },
        { at: parentBlock[1] }
      )
      Transforms.select(editor, Editor.end(editor, parentBlock[1]))
      addMetaObject({
        keyword,
        type: 'knowledge'
      }).then(obj => {
        addLink(obj.id)
        const node = Editor.above(editor, {
          match: n => n.type === 'paragraph' && n.id === paraId
        })
        if (!node) return
        // retrieve meta object path
        const idx = node[0].children.findIndex(i => i.id === metaId)
        Transforms.setNodes(editor, { originId: obj.id }, { at: [...node[1], idx], voids: true })
      })
      manager.close()
      document.removeEventListener('keyup', handleKeywordChange)
      document.removeEventListener('keydown', handleKeywordChange)
      return
    }
    if (e.type === 'keydown') return
    setQuery(keyword)
  })
  const handleMetaObjectClick = (obj: MetaKnowledgeObject) => {
    manager.close()
    document.removeEventListener('keyup', handleKeywordChange)
    document.removeEventListener('keydown', handleKeywordChange)
    const parentBlock = Positions.parentBlock(editor)
    if (!parentBlock) return
    Transforms.removeNodes(editor, { at: parentBlock[1] })
    Transforms.insertNodes(
      editor,
      {
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
      },
      { at: parentBlock[1] }
    )
    Transforms.select(editor, Editor.end(editor, parentBlock[1]))
    addLink(obj.id)
  }
  const addLink = (knowledgeId: number) => {
    const noteId = editor.noteId
    if (noteId) {
      const noteMetaObjectId = getMetaObjectByNoteId(noteId)?.id
      const link: Partial<MetaLink> = {
        id: Id.getId(),
        targetId: knowledgeId,
        targetType: 'knowledge',
        sourceType: 'note',
        sourceId: noteMetaObjectId,
        label: 'from'
      }
      addMetaLink(link)
    }
  }
  return (
    <WithBorder>
      <MetaQueryCard query={query} onMetaObjectClick={handleMetaObjectClick} />
    </WithBorder>
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
      if (selectedIdx >= 0) {
        e.preventDefault()
        e.stopPropagation()
        onMetaObjectClick(metaObjects[selectedIdx])
      }
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
              key={i.keyword}
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

export default EditorMetaQuery
