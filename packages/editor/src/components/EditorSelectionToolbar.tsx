import { AnimatePopover, WithBorder, ToolbarV2, Menu } from '@/components'
import { CSSProperties, FC, useEffect, useMemo, useRef, useState, memo } from 'react'
import { Editor, Element, Range, Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from '../slate-react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { Colors, Icons, KEY, Zindexes } from '@/consts'
import useEditorInstance from '../hooks/useEditorInstance'
import { EditorStateAtom } from '../hooks/useEditorState'
import useReadOnlyEditor from '../hooks/useReadOnly'
import isHotkey from 'is-hotkey'
import { XYPosition } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import useExplainButton from '@/core/global/components/useExplainButton'
import trans from '@/consts/trans'
import toast from 'react-hot-toast'
import { getSelectionDirection } from '@/utils/text'
import classnames from 'classnames'
import { useUpdate } from 'react-use'
import EditorColorPicker from '../components/EditorColorPicker'
import LabelNoteRenderer from '@/core/object/renderer/LabelNoteRenderer'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import EditorElements from '../elements/EditorElements'

type EditorToolbarEvents = {
  action: 'link' | 'highlight'
  currentToolbarPosition?: XYPosition
  toolbarDirection: 'top' | 'bottom'
}
interface EditorToolbarProps {
  scrollElement?: HTMLElement | null
  on: (event: EditorToolbarEvents) => Promise<any>
  style?: CSSProperties
}

const EditorToolbar: FC<EditorToolbarProps> = ({ scrollElement, on }) => {
  const toolbarOptions = useSelectAtomValue(EditorStateAtom, s => s.toolbar)
  const enableShowRightBar = useSelectAtomValue(EditorStateAtom, s => s.layout?.showHeader) !== false
  const { t } = useTranslation()
  const editor = useSlateStatic()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const position = 'float'
  const labelType = useSelectAtomValue(EditorStateAtom, s => s.labelType)
  const [floatPosition, setFloatPosition] = useState<{
    top: number
    left: number
    direction: 'top' | 'bottom'
    visible: boolean
    highlightId?: number
  }>()
  const labelMeta = MetaStore.useObjectToMetaValue(floatPosition?.highlightId)
  const isOnHighlightRef = useRef(false)
  const instance = useEditorInstance()
  const readOnly = useReadOnlyEditor()
  const disableShowHighlight = useMemo(() => {
    if (floatPosition?.visible) {
      return (
        Array.from(
          Editor.nodes(editor, {
            match: n => {
              return 'type' in n && n.type === 'synced'
            }
          })
        ).length > 0
      )
    }
    return false
  }, [floatPosition?.visible])
  const [currentElementName, setCurrentElementName] = useState<string>()
  useEffect(() => {
    if (floatPosition?.visible) {
      const currentElement = instance.blockOps?.getAboveBlock()
      if (currentElement) {
        const type = currentElement?.[0]?.type
        if (type) {
          const name = EditorElements[type]?.name
          setCurrentElementName(name)
        }
      }
    }
  }, [floatPosition?.visible])
  editor.onHighlightClick = (id, e) => {
    if (floatPosition?.visible && id === floatPosition?.highlightId) {
      setFloatPosition(s => ({ ...s, visible: false }))
      return
    }
    const location = instance.getHighlightLocation?.(id)
    if (location?.length) {
      const first = location[0]
      const last = location[location.length - 1]
      const range = Editor.range(editor, first[1], last[1])
      if (range) {
        Transforms.setSelection(editor, range)
        editor.selection = range
        selectionRef.current = range
        isOnHighlightRef.current = true
        setTimeout(
          () => {
            setFloatPosition({
              direction: 'top',
              left: e.clientX,
              top: e.clientY,
              visible: true,
              highlightId: id
            })
          },
          clickCloseToolbar.current ? 200 : 0
        )
      }
    }
  }
  const clickCloseToolbar = useRef(false)
  const handleMouseUp = useMemoizedFn((e: MouseEvent) => {
    // set timeout here to detect if clear selection mouseup
    setTimeout(() => {
      const { selection } = editor
      const windowSelection = window.getSelection()
      const target = e.target
      const container = instance.values.scrollElementRef.current
      if (!container?.contains(target)) return
      if (
        selection &&
        windowSelection &&
        windowSelection.toString().trim().length > 0 &&
        !Range.isCollapsed(selection) &&
        !toolbarRef.current?.contains(e.target)
      ) {
        const targetNode = Editor.node(editor, selection)
        if (Editor.isVoid(editor, targetNode)) {
          return
        }
        const range = windowSelection.getRangeAt(0)
        const direction = getSelectionDirection()
        const bounding = range.getClientRects()[direction === 'down' ? range.getClientRects().length - 1 : 0]
        if (!bounding) return
        setFloatPosition({
          left: direction === 'down' ? bounding.right : bounding.left,
          top: direction === 'down' ? bounding.bottom : bounding.top,
          direction: direction === 'down' ? 'bottom' : 'top',
          visible: true
        })
      }
    })
  })
  const handleMouseDown = (e: MouseEvent) => {
    if (floatPosition?.visible) {
      if (!toolbarRef.current?.contains(e.target)) {
        if (document.querySelector('[role="click-cover"]')) {
          e.preventDefault()
          return
        }
        window.getSelection()?.empty()
        setFloatPosition(s => ({ ...s, visible: false }))
        clickCloseToolbar.current = true
        setTimeout(() => {
          clickCloseToolbar.current = false
        }, 100)
        isOnHighlightRef.current = false
      }
    }
  }

  const selectionRef = useRef<typeof editor.selection>()
  const toolbarClicked = useRef(false)
  const handleScroll = e => {
    closeToolbar()
  }
  const handleHighlight = async () => {
    const marks = Editor.marks(editor)
    if (marks['highlight']) {
      isOnHighlightRef.current = false
    } else {
      isOnHighlightRef.current = true
    }
    if (floatPosition) {
      on({
        action: 'highlight',
        currentToolbarPosition: {
          x: floatPosition.left,
          y: floatPosition.direction === 'top' ? floatPosition.top - 16 : floatPosition.top
        },
        toolbarDirection: floatPosition.direction || 'bottom'
      })
    }
    window.getSelection()?.empty()
    setFloatPosition(s => ({ ...s, visible: false }))
  }
  useEffect(() => {
    if (position === 'float') {
      document.addEventListener('pointerup', handleMouseUp)
      document.addEventListener('pointerdown', handleMouseDown)
      scrollElement?.addEventListener('scroll', handleScroll)
      return () => {
        document.removeEventListener('pointerup', handleMouseUp)
        document.removeEventListener('pointerdown', handleMouseDown)
        scrollElement?.removeEventListener('scroll', handleScroll)
      }
    }
  })

  useEffect(() => {
    const handleKeydown = async (e: KeyboardEvent) => {
      if (readOnly && isHotkey(KEY.Enter, e)) {
        setTimeout(() => {
          if (!e.defaultPrevented) {
            handleHighlight()
          }
        })
      }
    }
    const handleSelectionChange = () => {
      if (toolbarClicked.current) return
      const target = window.getSelection()?.anchorNode
      if (target && toolbarRef.current?.contains(target)) return
      setFloatPosition(s => ({ ...s, visible: false }))
    }
    if (floatPosition?.visible) {
      selectionRef.current = editor.selection
      document.addEventListener('selectionchange', handleSelectionChange)
      document.addEventListener('keydown', handleKeydown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('selectionchange', handleSelectionChange)
      selectionRef.current = undefined
    }
  }, [floatPosition?.visible])
  const update = useUpdate()
  const isMarkActive = format => {
    try {
      const marks = Editor.marks(editor)
      return marks ? format in marks && marks[format] !== undefined : false
    } catch (e) {
      return false
    }
  }

  const getMark = (mark: string) => {
    try {
      const marks = Editor.marks(editor)
      return marks ? marks[mark] : undefined
    } catch (e) {
      console.log(e)
    }
  }
  const toggleMark = (mark: string) => {
    const isActive = isMarkActive(mark)
    if (isActive) {
      Editor.removeMark(editor, mark)
    } else {
      Editor.addMark(editor, mark, true)
    }
    update()
  }
  const closeToolbar = () => {
    if (floatPosition?.visible) {
      setFloatPosition(s => ({ ...s, visible: false }))
    }
  }

  const getSelectedText = () => {
    return (window.getSelection()?.toString() || (editor.selection ? Editor.string(editor, editor.selection) : '')).replace(
      /\n\s*\n/g,
      '\n'
    )
  }

  const getAboveBlock = () => {
    if (editor.selection) {
      const blocks = Array.from(
        Editor.nodes(editor, {
          at: editor.selection,
          mode: 'highest',
          match: n => Element.isElement(n) && 'id' in n
        })
      )
      console.log(blocks)
      return blocks.map(i => i[0].id)
    }
  }

  const explainItem = useExplainButton({
    onGetExplain: async () => {
      const text = getSelectedText()
      closeToolbar()
      if (text) {
        const source = await instance.on({
          type: 'getSource'
        })
        if (source) {
          return {
            query: text,
            initialMessages: instance.aiOps?.getInitialMessages(),
            targetChatId: instance.aiOps?.getActiveChatId(),
            source: {
              ...source,
              labelId: floatPosition?.highlightId,
              selectedText: text,
              blockId: getAboveBlock(),
              selection: editor.selection
            }
          }
        }
      }
    }
  })
  const renderReadOnlyToolbar = () => {
    const hasTag = Global.metaOps.hasTag(labelMeta)
    return (
      <ToolbarV2
        layout={[
          toolbarOptions?.highlight !== false &&
            !disableShowHighlight &&
            !floatPosition?.highlightId && {
              icon: Icons.Highlight,
              type: 'button',
              key: 'highlight',
              onPointerDown: e => e.preventDefault(),
              onClick: () => handleHighlight(),
              text: t('general.highlight')
            },
          floatPosition?.highlightId && {
            icon: Icons.Edit,
            type: 'button',
            key: 'edit-highlight',
            text: t(trans.Edit),
            onClick: () => {
              closeToolbar()
              ObjectStore(labelType)
                .getOneById(floatPosition!.highlightId!)
                .then(i => {
                  if (i) {
                    instance.labelOps?.openLabelEditor?.(
                      i,
                      {
                        width: 0,
                        height: 0,
                        top: floatPosition.top - 16,
                        left: floatPosition!.left
                      },
                      editor.selection,
                      'top'
                    )
                  }
                })
            }
          },
          explainItem,
          {
            type: 'button',
            key: 'translate',
            icon: Icons.Translate,
            text: t(trans.Translate),
            onClick: async e => {
              closeToolbar()
              const text = getSelectedText()
              if (text) {
                const source = await instance.on({
                  type: 'getSource'
                })
                if (source) {
                  Global.commonOps?.translate?.({
                    query: text,
                    e,
                    targetChatId: instance.aiOps?.getActiveChatId(),
                    source: {
                      ...source,
                      selectedText: text,
                      blockId: getAboveBlock(),
                      selection: editor.selection
                    }
                  })
                }
              }
            }
          },
          floatPosition?.highlightId && {
            type: 'separator',
            key: 's-2'
          },
          floatPosition?.highlightId && {
            icon: Icons.Tag,
            key: 'tag',
            type: 'button',
            theme: hasTag ? 'filled' : undefined,
            className: hasTag ? 'text-yellow-500' : undefined,
            popover: () => (
              <WithBorder className={'min-w-72'}>
                <MetaTagPicker
                  alreadyTags={labelMeta?.tags || []}
                  onChange={v => {
                    if (labelMeta) {
                      MetaStore.updateMetaObject({ id: labelMeta.id, tags: v })
                    }
                  }}
                />
              </WithBorder>
            )
          },
          floatPosition?.highlightId && {
            icon: Icons.Link,
            tooltip: t(trans.CopyLink),
            key: 'copy-link',
            type: 'button',
            onClick: () => {
              closeToolbar()
              const m = MetaStore.getMetaObjectByObjectId(floatPosition!.highlightId!)
              if (m) {
                Global.metaOps?.copyLink(m.id)
              }
            }
          },
          floatPosition?.highlightId && {
            type: 'button',
            key: 'copy',
            icon: Icons.Copy,
            tooltip: t(trans.Copy),
            onClick: () => {
              closeToolbar()
              const text = getSelectedText()
              if (text) {
                navigator.clipboard.writeText(text)
                toast.success(t(trans.Copied))
              }
            }
          },
          floatPosition?.highlightId && {
            key: 'remove-highlight',
            icon: Icons.Delete,
            tooltip: t(trans.Delete),
            type: 'button',
            onClick: () => {
              closeToolbar()
              handleHighlight()
            }
          },
          floatPosition?.highlightId && {
            icon: Icons.More,
            strokeWidth: 6,
            key: 'highlight-more',
            type: 'button',
            popover: (
              <WithBorder className={'py-1 min-w-52'}>
                <Menu.NavigationMenu
                  layout={[
                    {
                      icon: Icons.Info,
                      text: t(trans.Meta.ViewDetails),
                      key: 'view-info',
                      type: 'item',
                      onSelect: () => {
                        closeToolbar()
                        const m = MetaStore.getMetaObjectByObjectId(floatPosition!.highlightId!)
                        if (m) {
                          Global.metaOps?.openDetails(m.id)
                        }
                      }
                    },
                    enableShowRightBar && {
                      icon: 'custom-right-bar',
                      text: t('general.Open in sidebar'),
                      type: 'item',
                      key: 'open-highlight-in-sidebar',
                      onSelect: () => {
                        closeToolbar()
                        instance.labelOps?.openLabelInSidebar(floatPosition.highlightId!)
                      }
                    },
                    {
                      icon: Icons.MoveTo,
                      text: t(trans.Meta.MoveTo),
                      key: 'move-to',
                      type: 'item',
                      onSelect: () => {
                        closeToolbar()
                        const m = MetaStore.getMetaObjectByObjectId(floatPosition!.highlightId!)
                        if (m) {
                          Global.metaOps?.quickAdd(m.id)
                        }
                      }
                    }
                  ]}
                />
              </WithBorder>
            )
          }
        ]}
      />
    )
  }
  const renderToolbar = () => (
    <ToolbarV2
      layout={[
        currentElementName && {
          type: 'button',
          key: 'transform',
          suffixIcon: 'park-down',
          suffixIconClassName: '-ml-5',
          onClick: e => {
            const bounding = e.currentTarget.getBoundingClientRect()
            if (bounding) {
              instance.overlayOps?.open('transformMenu', {
                x: bounding.left + bounding.width / 2,
                y: bounding.bottom - 14
              })
            }
          },
          text: currentElementName
        },
        {
          type: 'button',
          key: 'link',
          text: t('editor.link'),
          icon: 'park-link-one',
          onClick: () => {
            if (floatPosition) {
              on({
                action: 'link',
                currentToolbarPosition: {
                  x: floatPosition.left,
                  y: floatPosition.top
                },
                toolbarDirection: floatPosition.direction
              })
            }
            closeToolbar()
          }
        },
        {
          type: 'separator',
          key: 's-1'
        },
        {
          type: 'button',
          key: 'font-color',
          popover: setV => (
            <EditorColorPicker
              onClick={() => {
                toolbarClicked.current = true
              }}
              color={getMark('fontColor')}
              background={getMark('backgroundColor')}
              onBackgroundChange={f => {
                if (f === undefined) {
                  Editor.removeMark(editor, 'backgroundColor')
                } else {
                  Editor.addMark(editor, 'backgroundColor', f)
                }
                update()
              }}
              onColorChange={f => {
                if (f === undefined) {
                  Editor.removeMark(editor, 'fontColor')
                } else {
                  Editor.addMark(editor, 'fontColor', f)
                }
                update()
              }}
            />
          ),
          element: (
            <div className={'square-button !w-8 flex items-center justify-center !h-8'}>
              <div
                style={{
                  color: getMark('fontColor'),
                  background: `rgb(from ${Colors.getAdaptColor(getMark('backgroundColor'))} r g b / var(--editor-bg-opacity))`,
                  borderRadius: 4,
                  padding: 4,
                  lineHeight: 1,
                  width: '1.4rem',
                  height: '1.4rem',
                  flexShrink: 0,
                  display: 'flex',
                  fontWeight: 700,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                className={'font-size-13'}
              >
                A
              </div>
            </div>
          )
        },
        {
          type: 'button',
          key: 'bold',
          text: 'B',
          className: 'w-8 justify-center !px-0 font-bold',
          textClassName: isMarkActive('bold') ? 'select-color-font' : undefined,
          onClick: () => {
            toggleMark('bold')
          }
        },
        {
          type: 'button',
          key: 'italic',
          text: 'i',
          className: 'w-8 justify-center !px-0 font-bold',
          textClassName: isMarkActive('italic') ? 'select-color-font italic' : 'italic',
          onClick: () => {
            toggleMark('italic')
          }
        },
        {
          type: 'button',
          key: 'underline',
          text: 'U',
          className: classnames('w-8 underline justify-center !px-0 font-bold', isMarkActive('underline') && 'select-color-font'),
          onClick: () => {
            toggleMark('underline')
          }
        },
        {
          type: 'button',
          key: 'code',
          icon: 'park-code',
          className: classnames('w-8', isMarkActive('code') ? 'select-color-font' : undefined),
          onClick: () => {
            toggleMark('code')
          }
        },
        {
          type: 'button',
          key: 'cloze',
          className: classnames('w-8', isMarkActive('cloze') ? 'select-color-font' : undefined),
          icon: 'park-code-brackets',
          onClick: () => {
            toggleMark('cloze')
          }
        }
      ]}
    ></ToolbarV2>
  )
  // only render when have noteid
  const renderFloatToolbar = () =>
    createPortal(
      <AnimatePopover
        padding={10}
        visible={!!floatPosition?.visible}
        position={{
          left: floatPosition?.left,
          top: floatPosition?.top
        }}
        positions={[floatPosition?.direction || 'top']}
        containerStyle={{ zIndex: String(Zindexes.EditorSelectionToolbar), borderRadius: 5 }}
        content={() => (
          <WithBorder
            onPointerDown={() => {
              toolbarClicked.current = true
            }}
            onClick={() => {
              setTimeout(() => {
                toolbarClicked.current = false
              }, 100)
            }}
            className={'!rounded-lg'}
            style={{
              width: 'fit-content'
            }}
            ref={toolbarRef}
          >
            {floatPosition?.highlightId && <LabelNoteRenderer id={floatPosition.highlightId} />}
            {readOnly ? renderReadOnlyToolbar() : renderToolbar()}
          </WithBorder>
        )}
      />,
      document.body,
      'editorToolbar'
    )

  return renderFloatToolbar()
}

export default memo(EditorToolbar)
