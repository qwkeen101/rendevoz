import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn, useUnMount } from '@/hooks'
import Id from '@/utils/id'
import { FC, FormEvent, memo, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEditor, Transforms, Descendant, Range } from 'slate'
import { withHistory } from 'slate-history'
import { withReact, ReactEditor } from './slate-react'
import { CustomElement } from './types'
import InnerEditor from './InnerEditor'
import withVoid from './plugins/withVoid'
import styles from './index.module.less'
import BlockHandle from './components/blockHandle'
import useIsDragging from './hooks/useIsDragging'
import { serializeEditor } from './utils/database/serialize'
import useNoteStore, { notesAtom } from '@/stores/note.store'
import useCurrentDocument from '../../hooks/components/useCurrentDocument'
import useDocumentStore from '@/stores/document.store'
import { withYjs, YjsEditor } from './yjs'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import Modal from '../base/modal'
import SaveNoteDialog from '../dialogs/SaveNoteDialog'
import toast from 'react-hot-toast'
import produce from 'immer'
import { ICollection, INote, MetaNoteObject } from '~/typings/data'
import useCollectionStore from '@/stores/collection.store'
import withShortcuts from './plugins/withShortcuts'
import withCustomComponent from './plugins/withCustomComponent'
import { Content, Icon, Image } from '../base'
import withEmitter from './plugins/withEmitter'
import withHtml from './plugins/withHtml'
import { useTranslation } from 'react-i18next'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from './weakMaps'
import { Noop } from '@/common/types'
import _ from 'lodash'
import useMetaStore, { metaObjectsAtom } from '@/stores/meta.store'
import TabTitle from '../layout/TabTitle'
import useLocalSyncValue from './hooks/useSyncValue'
import useEditorDrag from './hooks/useEditorDrag'
import { useGlobalIsDragging } from '../globalDragOverlay'
import useEditorOverlay from './components/overlay/useEditorOverlay'
import { css } from '@emotion/css'
import withHandler from './plugins/withHandler'
import useEditorSelect from './hooks/useEditorSelect'
import ClassName from '@/styles/classNames'
import { atom, useAtomValue } from 'jotai'
import { GlobalScope } from '@/jotai/jotaiScope'
import useStoreValue from './hooks/useStoreValue'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts/key'

type DragHandleProps = {
  left?: number
  top?: number
  targetHeight?: number
  targetId?: number
  visible?: boolean
}
const initial = [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]

export interface EditorProps {
  onChange?: (e: Descendant[]) => void
  onClick?: () => void
  initialValue?: Descendant[]
  id: string
  noteId: number
  readonly?: boolean
  embedded?: boolean
}
export interface IEditorRef {
  insertNode: (element: CustomElement) => void
  elementPropertyChange: (element: CustomElement) => void
  outerElementPropertyChange: (element: CustomElement) => void
  resetEditor: (value: Descendant[], title?: string) => void
  jumpToBlock: (blockId: number) => void
}
export const GlobalProviderMap = new Map()
export const EditorV1: FC<EditorProps> = memo(({ id, noteId, readonly, embedded }) => {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useIsDragging()
  const [globalIsDragging] = useGlobalIsDragging()

  const titleRef = useRef<HTMLDivElement>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const [dragHandle, setDragHandle] = useState<DragHandleProps>()
  const emitter = useEventEmitter()
  const noteAtom = useMemo(() => atom(get => get(notesAtom).get(noteId)), [noteId])
  const note = useAtomValue(noteAtom, GlobalScope)
  const metaAtom = useMemo(() => atom(get => (note?.metaId ? get(metaObjectsAtom).get(note.metaId) : null)), [note?.metaId])
  const metaObject = useAtomValue(metaAtom, GlobalScope)
  const { fetchOneById: fetchNoteById, updateOne: updateNote } = useNoteStore()
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (dragHandle?.visible) {
        setDragHandle({ ...dragHandle, visible: false })
      }
    }
    const pointerDownHandler = (e: PointerEvent) => {
      const textbox = scrollElementRef.current?.querySelector('[role="textbox"]')
      const lastEleRect = textbox?.lastElementChild?.getBoundingClientRect()
      if (lastEleRect && e.clientY > lastEleRect.bottom) {
        Transforms.insertNodes(
          editor,
          {
            type: 'paragraph',
            children: [{ text: '' }],
            id: Id.getId()
          },
          {
            at: [editor.children.length]
          }
        )
        // Transforms.select(editor, [editor.children.length])
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    scrollElementRef.current?.addEventListener('pointerdown', pointerDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
      scrollElementRef.current?.removeEventListener('pointerdown', pointerDownHandler)
    }
  })
  useEffect(() => {
    fetchNoteById(noteId)
  }, [noteId])

  const { sharedType, doc, provider } = useMemo(() => {
    const doc = new Y.Doc()
    let provider
    if (!GlobalProviderMap.has(noteId)) {
      provider = new IndexeddbPersistence(String(noteId), doc)
      GlobalProviderMap.set(noteId, provider)
    } else {
      // share the same provider
      provider = GlobalProviderMap.get(noteId)
    }
    const sharedType = provider.doc.get('content', Y.XmlText)
    return { doc, provider, sharedType }
  }, [noteId])
  useEffect(() => {
    if (titleRef.current) {
      if (document.activeElement === titleRef.current) {
        if (note?.title === 'Untitled') {
          titleRef.current.textContent = metaObject?.name || ''
        } else {
          titleRef.current.textContent = metaObject?.name || note?.title || ''
        }
      } else {
        titleRef.current.textContent = metaObject?.name || note?.title || ''
      }
    }
  }, [note?.title, metaObject])
  const handler = (e: { type: string; data: any }) => {
    if (e.type === 'addMetaObject') {
      overlayManager.setContent('metaQuery')
      overlayManager.open()
    }
  }
  const editor = useMemo(() => {
    return withVoid(
      withHtml(
        withCustomComponent(
          withShortcuts(
            withHandler(withEmitter(withHistory(withReact(withYjs(createEditor(), sharedType, { autoConnect: false }))), emitter), handler)
          )
        )
      )
    )
  }, [sharedType])

  useLocalSyncValue(editor)
  useStoreValue(note, editor, provider, doc, sharedType)
  const dragManager = useEditorDrag(editor, scrollElementRef.current)
  const { renderOverlay, overlayManager, popoverVisible } = useEditorOverlay(editor, scrollElementRef.current)
  useEditorSelect(editor, overlayManager, scrollElementRef.current)

  useEffect(() => {
    ID_TO_ELEMENTS_MAP.set(editor, new Map())
    SELECTED_BLOCKS_MAP.set(editor, new Map())
    editor.id = id
    editor.noteId = noteId
    return () => {
      // disconnect
      if (YjsEditor.connected(editor)) {
        YjsEditor.disconnect(editor)
      }
    }
  }, [editor])

  useEffect(() => {
    if (readonly || embedded) {
      editor.readonly = true
    }
  }, [editor, readonly, embedded])
  const handleNestedListItem = useMemoizedFn((isNested: boolean) => {
    dragManager.shouldNested(isNested)
  })

  const handleBlockMouseMove = useMemoizedFn((e: MouseEvent, element: CustomElement) => {
    if (!isDragging && !globalIsDragging) {
      editor.currentEnterElement = element
      dragManager.registerDragElement(e.currentTarget as HTMLElement, ReactEditor.findPath(editor, element))
      if (dragHandle?.targetId !== element.id || dragHandle?.visible === false) {
        const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setDragHandle({
          left: targetRect.x - 5,
          top: targetRect.y,
          targetId: element.id,
          targetHeight: targetRect.height,
          visible: true
        })
      }
    }
  })
  const handleBlockHandleMenu: MouseEventHandler = e => {
    editor.currentAddClickElement = editor.currentEnterElement
    overlayManager.setContent('blockHandleMenu')
    const rect = e.currentTarget.getBoundingClientRect()
    console.log(rect)
    overlayManager.setPosition({
      left: rect.left + 10,
      top: rect.top
    })
    overlayManager.open()
  }
  const handleMenuClick: MouseEventHandler = e => {
    editor.currentAddClickElement = editor.currentEnterElement
    setIsDragging(false)
    overlayManager.setContent('blockDetailsMenu')
    const rect = e.currentTarget.getBoundingClientRect()
    overlayManager.setPosition({
      left: rect.left + 10,
      top: rect.top
    })
    overlayManager.open()
  }
  return (
    <div className={styles.editor}>
      <TabTitle title={note?.title || metaObject?.name || 'Untitled'} />
      <div ref={scrollElementRef} className={styles.scrollWrapper}>
        {metaObject?.coverImgSrc && (
          <Image
            className={css({
              width: '100% !important',
              height: !readonly ? 300 : 200,
              overflow: 'hidden',
              marginBottom: !readonly ? -50 : 0,
              flexShrink: 0,
              '> div': {
                ':first-child': {
                  transform: 'translateY(-30%)'
                }
              }
            })}
            src={metaObject.coverImgSrc}
          />
        )}
        <div
          role="inner-editor"
          className={styles.InnerEditorWrapper}
          style={{ padding: readonly ? '0px' : undefined, '--block-bg': readonly ? 'none' : undefined }}
        >
          <Content className={styles.titleWrapper} style={{ marginTop: readonly ? '0' : undefined }} flex column gap={10}>
            {!readonly && (
              <Content
                gap={10}
                className={css({
                  '> div': {
                    color: 'rgba(55,53,47,0.5)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      background: 'rgba(0,0,0,0.07)'
                    }
                  }
                })}
                flex
                alignItems="flex-end"
              >
                {metaObject?.coverImgSrc && (
                  <Image
                    className={css({
                      opacity: '1 !important'
                    })}
                    src={metaObject.coverImgSrc}
                  />
                )}
                {!metaObject && (
                  <Content flex gap={6}>
                    <Icon name="park-smiling-face" />
                    <span>Add icon</span>
                  </Content>
                )}
                <Content flex gap={6}>
                  <Icon name="park-add-picture" />
                  <span>Add cover</span>
                </Content>
              </Content>
            )}
            <div
              onInput={useMemoizedFn((e: FormEvent<HTMLDivElement>) => {
                note &&
                  updateNote({
                    id: note?.id,
                    title: e.currentTarget.textContent || 'Untitled'
                  })
              })}
              onBlur={() => {
                if (titleRef.current?.textContent === '') {
                  titleRef.current && (titleRef.current.textContent = 'Untitled')
                }
              }}
              onKeyDown={e => {
                if (isHotkey(KEY.Enter, e)) {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              spellCheck="false"
              className={styles.title}
              placeholder={t('editor.untitled')}
              suppressContentEditableWarning={true}
              contentEditable={metaObject === null}
              style={{
                maxWidth: '100%',
                width: '100%'
              }}
              ref={titleRef}
            />
            {metaObject?.description && (
              <div style={{ paddingLeft: 4, marginTop: -4, whiteSpace: 'pre-wrap' }} className={ClassName.description()}>
                {metaObject.description}
              </div>
            )}
          </Content>
          <InnerEditor
            readonly={readonly || embedded}
            scrollElement={scrollElementRef.current}
            editor={editor}
            defaultValue={initial}
            onBlockMouseMove={handleBlockMouseMove}
            onBlockMouseLeave={useMemoizedFn((e, element) => {
              setDragHandle({ ...dragHandle, visible: false })
            })}
            onNestedListItem={handleNestedListItem}
          />
        </div>
      </div>
      {renderOverlay()}
      <BlockHandle
        onAddClick={handleBlockHandleMenu}
        onDragClick={useCallback(() => {
          setIsDragging(true)
        }, [])}
        onMenuClick={handleMenuClick}
        {...dragHandle}
        visible={!!(!isDragging && dragHandle?.visible && !popoverVisible && !readonly)}
      />
    </div>
  )
})
