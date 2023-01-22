import './dock.less'
import DockLayout, { DockContext, LayoutData, PanelData, TabData } from '../base/dock'
import { cloneElement, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import EditorManagerMenu from '../menus/EditorManagerMenu'
import { useSelectedEditorRef } from './hooks/useSelectedEditorRef'
import useEventEmitter from '@/events/useEventEmitter'
import { EditorEventHandler } from '../../events/editorEvent'
import { EditorV1 } from './Editor'
import useNoteStore from '@/stores/note.store'
import { Content, Footer, WithBorder } from '../base'
import Id from '@/utils/id'
import IconWithPopover from '../base/IconWithPopover'
import toast from 'react-hot-toast'
import { INote } from '~/typings/data'
import { useIsomorphicLayoutEffect } from 'react-use'
import { useTranslation } from 'react-i18next'
import { useConfirmExit } from '@/hooks/utils/usePrompt'
import Modal from '../base/Modal'
import { useMemoizedFn, useSetting, useToggle } from '@/hooks'
import { css } from '@emotion/css'
import produce from 'immer'

const EditorManagerMenuPopover = ({ panel = {} as PanelData, context = {} as DockContext }) => {
  const popoverRef = useRef()
  return (
    <Content flex centered style={{ marginRight: 15 }}>
      <IconWithPopover
        tooltip="More"
        placement={['bottom', 'left']}
        name="park-more"
        innerRef={popoverRef}
        zIndex={1000}
        padding={10}
        size={24}
        color="#8590ae"
        boundaryInset={20}
        content={
          <WithBorder>
            <EditorManagerMenu onClose={() => popoverRef.current?.close()} panel={panel} context={context} />
          </WithBorder>
        }
      />
    </Content>
  )
}
interface EditorManagerProps {
  initialNoteId?: number
  documentId?: number
  onSave?: number
  titleMarginTop?: number
}
export let isEditorInitialized = false
const EditorManager: FC<EditorManagerProps> = ({ initialNoteId, documentId, onSave, titleMarginTop = 0 }) => {
  const selectedEditorRef = useSelectedEditorRef()
  const eventEmitter = useEventEmitter()
  const layoutRef = useRef<DockLayout>()
  const eventHandler = new EditorEventHandler()
  const firstNoteId = initialNoteId || Id.getId()
  const { t } = useTranslation()
  const { saveNote, getNoteById, updateNote } = useNoteStore()
  const [confirmVisible, toggleConfirmVisible] = useToggle(false)
  const [canExit, setCanExit] = useState(false)
  const [notesMap, setNotesMap] = useState(new Map())
  const unsavedNotes = Array.from(notesMap.values()).filter(i => i.unsaved)
  const [setting] = useSetting()
  useEffect(() => {
    if (unsavedNotes.length === 0) {
      setCanExit(true)
    } else {
      setCanExit(false)
    }
  }, [notesMap])
  useConfirmExit(setting.editor.confirmExit ? canExit : true, toggleConfirmVisible)
  eventHandler.on('foldHeading', data => {
    selectedEditorRef?.current?.foldHeading(data.headingId, data.folded)
  })
  eventHandler.on('insertNode', data => {
    selectedEditorRef?.current?.insertNode(data.element)
  })
  eventHandler.on('elementPropertyChange', data => {
    selectedEditorRef.current?.elementPropertyChange(data.element)
  })
  eventHandler.on('outerElementPropertyChange', data => {
    console.log(data)
    selectedEditorRef.current?.outerElementPropertyChange(data.element)
  })
  eventHandler.on('openMenu', () => {
    console.log('open')
  })
  eventHandler.on('toggleThoughtLayer', () => {
    selectedEditorRef.current?.toggleMindMapLayer()
  })
  eventHandler.on('deleteSubPage', data => {
    const subPageNoteId = data.subPageNoteId
    getNoteById(subPageNoteId)
      .then(note => ({
        ...note,
        parentNoteId: undefined
      }))
      .then(n => updateNote(n))
  })
  eventHandler.on('tabDataChange', data => {
    const { id, tab } = data
    const oldTab = layoutRef.current?.find(id) as TabData
    const newTitle = tab.title === 'Untitled' || !tab.title ? t('editor.untitled') : tab.title
    tab.title = cloneElement(oldTab.title, {}, newTitle)
    const newTab = {
      ...oldTab,
      ...tab
    }
    layoutRef.current?.updateTab(id, newTab)
  })
  eventHandler.on('insertTab', data => {
    insertOrSwitchTab(data)
  })
  eventHandler.on('deletePanel', data => {
    const panelId = data.panelId
    const currLayout = layoutRef.current?.getLayout()
    if (!currLayout || currLayout.dockbox.children.length === 1) {
      toast.error("Can't close all panels!")
      return
    }
    const panel = layoutRef.current?.find(panelId) as PanelData
    layoutRef.current?.dockMove(panel, null, 'remove')
  })
  eventHandler.on('switchTab', data => {
    const targetTab = layoutRef.current?.find(data.tabId || String(data.noteId))
    layoutRef.current?.updateTab(targetTab?.id, targetTab)
  })
  eventHandler.on('jumpToBlock', data => {
    // wtf is this?
    insertOrSwitchTab({
      noteId: data.noteId,
      isNew: false
    }).then(() => {
      selectedEditorRef.current?.jumpToBlock(data.blockId)
    })
  })
  const insertOrSwitchTab = async data => {
    const layout = layoutRef.current
    if (layout) {
      const id = data.id || Id.getStrId()
      const panelId = data.panelId || layout.getGlobal().currentFocusedPanelId || layout.getLayout().dockbox.children[0].id

      // we are adding a sub page,so we need to save the note first
      if (data.parentNoteId) {
        const subPageNote: INote = {
          id: data.noteId,
          parentNoteId: data.parentNoteId,
          title: ''
        }
        return new Promise(() => {
          saveNote(subPageNote)?.then(() => {
            const editor = defaultEditor({
              id,
              noteId: subPageNote.id,
              onInitialized: () => {
                return Promise.resolve()
              }
            })
            layout.dockMove(editor, panelId, 'middle')
            eventEmitter.emit('editor', {
              type: 'switchTab',
              data: {
                tabId: id
              }
            })
          })
        })
      }
      if (panelId) {
        const noteId = data.noteId
        if (noteId && !data.isNew) {
          // maybe it has been opened
          const mayBeTargetTab = layout.find(String(noteId)) as TabData | null
          if (mayBeTargetTab) {
            eventEmitter.emit('editor', {
              type: 'switchTab',
              data: {
                tabId: mayBeTargetTab.id
              }
            })
            return Promise.resolve()
          }
          const note = await getNoteById(noteId).catch(e => {
            return null
          })
          if (note) {
            return new Promise(resolve => {
              const editor = defaultEditor({
                id,
                noteId,
                title: note.title,
                onInitialized: () => resolve(null)
              })
              layout.dockMove(editor, panelId, 'middle')
              eventEmitter.emit('editor', {
                type: 'switchTab',
                data: {
                  tabId: id
                }
              })
            })
          } else {
            toast.error('Target note not found!')
          }
        }
        return new Promise(resolve => {
          const editor = defaultEditor({
            id,
            noteId,
            onInitialized: () => resolve(null)
          })
          layout.dockMove(editor, panelId, 'middle')
          eventEmitter.emit('editor', {
            type: 'switchTab',
            data: {
              tabId: id
            }
          })
        })
      }
    }
  }
  const handleTitleChange = useMemoizedFn((title: string, id: string, noteId: number) => {
    const oldTab = layoutRef.current?.find(id) as TabData
    const newTitle = title === 'Untitled' || !title ? t('editor.untitled') : title
    const newTab = {
      ...oldTab,
      title: cloneElement(oldTab.title, {}, newTitle)
    }
    layoutRef.current?.updateTab(id, newTab)
    setNotesMap(
      produce(notesMap, draft => {
        draft.set(noteId, {
          ...draft.get(noteId),
          title: newTitle
        })
      })
    )
  })
  const handleNoteSave = useMemoizedFn((noteId: number) => {
    setNotesMap(
      produce(notesMap, draft => {
        draft.set(noteId, {
          ...draft.get(noteId),
          unsaved: false
        })
      })
    )
  })
  const handleTabClose = useMemoizedFn((tab: TabData) => {
    setNotesMap(
      produce(notesMap, draft => {
        draft.delete(tab.noteId)
      })
    )
  })
  const handleInitialized = useMemoizedFn((id: string, noteId: number, title?: string, isSaved?: boolean) => {
    setNotesMap(
      produce(notesMap, draft => {
        draft.set(noteId, {
          noteId,
          id,
          title: title === 'Untitled' || !title ? t('editor.untitled') : title,
          unsaved: !isSaved
        })
      })
    )
  })
  const defaultEditor = useCallback(
    ({
      id,
      noteId,
      title,
      content,
      onInitialized
    }: {
      id: string
      noteId?: number
      title?: string
      content?: string
      onInitialized?: () => void
    }): TabData => {
      noteId = noteId || Id.getId()
      return {
        id,
        onTabClick: e => {
          eventEmitter.emit('editor', {
            type: 'switchTab',
            data: {
              tabId: id
            }
          })
        },
        title: <div>{title === 'Untitled' || !title ? t('editor.untitled') : title}</div>,
        content: (
          <div key={id} style={{ display: 'flex', height: '100%', paddingBottom: 30 }}>
            <EditorV1
              key={id}
              titleMarginTop={titleMarginTop}
              onTitleChange={title => handleTitleChange(title, id, noteId)}
              onEditorInitialized={isSaved => {
                onInitialized?.()
                handleInitialized(id, noteId, title, isSaved)
              }}
              onSave={() => handleNoteSave(noteId)}
              id={id}
              noteId={noteId}
              initialValue={content}
            />
          </div>
        ),
        noteId,
        cached: true
      }
    },
    []
  )
  const defaultLayout: LayoutData = useMemo(
    () => ({
      global: {
        globalPanelExtra: (panel, context) => <EditorManagerMenuPopover panel={panel} context={context} />,
        disableFloat: true,
        disableSinglePanelMove: true,
        onTabClose: handleTabClose
      },
      dockbox: {
        mode: 'horizontal',
        children: [
          {
            tabs: [defaultEditor({ id: '1', noteId: firstNoteId, title: t('editor.untitled') })]
          }
        ]
      }
    }),
    []
  )

  useIsomorphicLayoutEffect(() => {
    isEditorInitialized = true
    eventEmitter.addListener('editor', eventHandler)
    return () => {
      isEditorInitialized = false
      eventEmitter.removeListener('editor', eventHandler)
    }
  }, [])

  return (
    <>
      <DockLayout
        defaultLayout={defaultLayout}
        ref={layoutRef}
        dropMode="edge"
        style={{
          position: 'absolute',
          inset: 0
        }}
      />
      <Modal width={400} minHeight={300} visible={confirmVisible} onClose={toggleConfirmVisible}>
        <Content flex column justifyContent="space-between" style={{ minHeight: 'inherit' }}>
          <Content flex column>
            <div
              className={css({
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 20
              })}
            >
              {t('editor.unsaved notes')}
            </div>
            <Content
              flex
              column
              className={css({
                marginBottom: 50,
                paddingLeft: 20
              })}
            >
              <ol>
                {unsavedNotes.map(i => (
                  <li
                    className={css({
                      fontSize: 16,
                      fontWeight: 600
                    })}
                  >
                    {i.title}
                  </li>
                ))}
              </ol>
            </Content>
            <div
              className={css({
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 30
              })}
            >
              {t('editor.confirm leave')}
            </div>
          </Content>
          <Footer
            onBack={toggleConfirmVisible}
            onSubmit={() => {
              setCanExit(true)
              toggleConfirmVisible()
            }}
          />
        </Content>
      </Modal>
    </>
  )
}

export default EditorManager
