import { AnimatePopover, Button, Toolbar, WithBorder, Content } from '@/components'
import IconWithPopover from '@/components/base/IconWithPopover'
import { CSSProperties, FC, useEffect, useMemo, useRef, useState, memo } from 'react'
import { Editor, Element, Range, Transforms } from 'slate'
import { ReactEditor, useSlate } from '../slate-react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import BlockColorPicker from './BlockColorPicker'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { css } from '@emotion/css'
import { Colors, KEY, Zindexes } from '@/consts'
import useEditorInstance from '../hooks/useEditorInstance'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'
import { Icon } from '@/components'
import isHotkey from 'is-hotkey'
import { XYPosition } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { lab } from 'd3'

type EditorToolbarEvents =
  | {
      action: 'redo' | 'undo' | 'bold' | 'italic' | 'underline' | 'code' | 'link' | 'highlight' | 'cloze'
      currentToolbarPosition?: XYPosition
    }
  | {
      action: 'changeFontSize'
      fontSize: string
    }
  | {
      action: 'changeFontColor'
      fontColor: string
    }
  | {
      action: 'changeBackgroundColor'
      backgroundColor: string
    }
interface EditorToolbarProps {
  scrollElement?: HTMLElement | null
  on: (event: EditorToolbarEvents) => Promise<any>
  style?: CSSProperties
}
const MAX_TOLERANT_DISTANCE = 15
const EditorToolbar: FC<EditorToolbarProps> = ({ scrollElement, style, on }) => {
  const showToolbar = useSelectAtomValue(EditorStateAtom, s => s.layout?.showToolbar)
  const toolbarOptions = useSelectAtomValue(EditorStateAtom, s => s.toolbar)
  const enableShowRightBar = useSelectAtomValue(EditorStateAtom, s => s.layout?.showHeader) !== false
  const { t } = useTranslation()
  const editor = useSlate()
  const toolbarRef = useRef<HTMLElement>(null)
  const position = 'float'
  const labelType = useSelectAtomValue(EditorStateAtom, s => s.labelType)
  const [floatPosition, setFloatPosition] = useState<{
    top: number
    left: number
    direction: 'top' | 'bottom'
    visible: boolean
    highlightId?: number
  }>()
  const isOnHighlightRef = useRef(false)
  const instance = useEditorInstance()
  const readOnly = useReadOnlyEditor()
  const disableShowHighlight = useMemo(() => {
    return (
      Array.from(
        Editor.nodes(editor, {
          match: n => {
            return 'type' in n && n.type === 'synced'
          }
        })
      ).length > 0
    )
  }, [floatPosition?.visible])
  let currentElement
  try {
    currentElement = instance.blockOps?.getAboveBlock()
  } catch (e) {
    console.error(e)
  }
  const currentElementName = EditorTypeToElementMap.get(currentElement?.[0]?.type)?.name
  editor.onHighlightClick = id => {
    const location = instance.getHighlightLocation?.(id)
    if (location?.length) {
      const first = location[0]
      const last = location[location.length - 1]
      const range = Editor.range(editor, first[1], last[1])
      if (range) {
        const domRange = ReactEditor.toDOMNode(editor, first[0])
        const bounding = domRange.getBoundingClientRect()
        Transforms.setSelection(editor, range)
        editor.selection = range
        selectionRef.current = range
        isOnHighlightRef.current = true
        setTimeout(
          () => {
            setFloatPosition({
              direction: 'top',
              left: bounding.left + bounding.width / 2,
              top: bounding.top,
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
      const container = ReactEditor.toDOMNode(editor, editor).closest('[role="editor-container"]')
      if (!container?.contains(target)) return
      if (
        showToolbar !== false &&
        selection &&
        windowSelection &&
        windowSelection.toString().trim().length > 0 &&
        !Range.isCollapsed(selection) &&
        !toolbarRef.current?.contains(e.target)
      ) {
        const targetNode = Editor.node(editor, selection)
        console.log(targetNode)
        if (Editor.isVoid(editor, targetNode)) {
          return
        }
        const anchorPoint = ReactEditor.toDOMPoint(editor, selection.anchor)
        const focusPoint = ReactEditor.toDOMPoint(editor, selection.focus)
        const anchorRange = document.createRange()
        anchorRange.setStart(anchorPoint[0], anchorPoint[1])
        anchorRange.setEnd(anchorPoint[0], anchorPoint[1])
        const anchorRect = anchorRange.getBoundingClientRect()
        const focusRange = document.createRange()
        focusRange.setStart(focusPoint[0], focusPoint[1])
        focusRange.setEnd(focusPoint[0], focusPoint[1])
        const focusRect = focusRange.getBoundingClientRect()
        let direction = 'top'
        if (anchorRect.bottom < focusRect.bottom && Math.abs(anchorRect.bottom - focusRect.bottom) > MAX_TOLERANT_DISTANCE) {
          direction = 'bottom'
        }
        setFloatPosition({
          left: focusRect.left + focusRect.width / 2,
          top: direction === 'top' ? focusRect.top : focusRect.bottom,
          direction,
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
      } else {
        e.preventDefault()
      }
    }
  }

  const selectionRef = useRef<typeof editor.selection>()
  const handleScroll = e => {
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
    const handleKeydown = (e: KeyboardEvent) => {
      setFloatPosition(s => ({ ...s, visible: false }))
    }
    if (floatPosition?.visible) {
      selectionRef.current = editor.selection
      document.addEventListener('keydown', handleKeydown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      selectionRef.current = undefined
    }
  }, [floatPosition?.visible])
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

  const renderToolbar = () => (
    <Toolbar
      itemRadius={0}
      innerRef={toolbarRef}
      style={{
        ...style,
        gap: 0,
        height: '32px',
        overflow: 'hidden',
        borderRadius: 5
      }}
      itemStyle={{
        padding: '0px 8px',
        height: '100%'
      }}
      itemClickPreventDefault
      itemSize={12}
    >
      {currentElementName && !readOnly && (
        <Toolbar.Item
          style={{
            paddingLeft: 12,
            borderRight: '1px solid var(--border-background)'
          }}
          onClick={e => {
            const bounding = e.currentTarget.getBoundingClientRect()
            if (bounding) {
              instance.overlayOps?.open('transformMenu', {
                x: bounding.left + bounding.width / 2,
                y: bounding.bottom - 20
              })
            }
          }}
        >
          <Content flex gap={4} alignItems={'center'}>
            <div style={{ fontSize: 14, marginRight: 6 }}>
              {typeof currentElementName === 'string' ? currentElementName : currentElementName()}
            </div>
            <Icon name={'park-down'} style={{ color: 'var(--font-transparent)' }} />
          </Content>
        </Toolbar.Item>
      )}
      {toolbarOptions?.highlight !== false && !disableShowHighlight && (
        <Toolbar.Item
          style={{
            borderRight: '1px solid var(--border-background)',
            padding: '0px 12px 0 10px'
          }}
          onClick={async () => {
            const marks = Editor.marks(editor)
            if (marks['highlight']) {
              isOnHighlightRef.current = false
            } else {
              isOnHighlightRef.current = true
            }
            on({ action: 'highlight', currentToolbarPosition: { x: floatPosition!.left, y: floatPosition!.top } })
            setFloatPosition(s => ({ ...s, visible: false }))
            window.getSelection()?.empty()
            ReactEditor.blur(editor)
            setTimeout(() => {
              Transforms.deselect(editor)
            }, 150)
          }}
        >
          <Button.IconButton
            style={{
              background: 'unset',
              padding: '0px'
            }}
            iconColor={floatPosition?.highlightId ? Colors.Emphasis.Emphasis : undefined}
            theme={floatPosition?.highlightId ? 'filled' : undefined}
            icon={'park-high-light'}
            text={floatPosition?.highlightId ? t('general.remove highlight') : t('general.highlight')}
          />
        </Toolbar.Item>
      )}
      {floatPosition?.highlightId && (
        <Toolbar.Item
          style={{
            borderRight: '1px solid var(--border-background)',
            padding: '0px 12px 0px 10px'
          }}
          onClick={async () => {
            setFloatPosition(s => ({ ...s, visible: false }))
            ObjectStore(labelType)
              .getOneById(floatPosition!.highlightId!)
              .then(i => {
                if (i) {
                  instance.labelOps?.openLabelEditor?.(
                    i,
                    {
                      width: 0,
                      height: 0,
                      top: floatPosition!.top,
                      left: floatPosition!.left
                    },
                    editor.selection
                  )
                }
              })
          }}
        >
          <Button.IconButton
            style={{
              background: 'unset',
              padding: '0px'
            }}
            icon={'park-edit'}
            text={t('general.edit')}
          />
        </Toolbar.Item>
      )}
      {floatPosition?.highlightId && enableShowRightBar && (
        // sometimes we hide sidebar, so don't need this
        <Toolbar.Item
          iconName="park-arrow-left-up"
          style={{
            borderRight: '1px solid var(--border-background)',
            padding: '0px 6px'
          }}
          tooltip={t('general.Open in sidebar')}
          onClick={() => {
            setFloatPosition(s => ({ ...s, visible: false }))
            instance.labelOps?.openLabelInSidebar(floatPosition.highlightId)
          }}
        />
      )}
      <Toolbar.Item
        onClick={() => {
          on({ action: 'link' })
          setFloatPosition(s => ({ ...s, visible: false }))
        }}
        style={{
          padding: '0px 8px',
          borderRight: '1px solid var(--border-background)'
        }}
      >
        <Button.IconButton
          style={{
            background: 'unset',
            padding: '0px'
          }}
          icon={'park-link-one'}
          text={t('editor.link')}
        />
      </Toolbar.Item>
      <Toolbar.Item
        tooltip={t('editor.bold')}
        style={{
          color: isMarkActive('bold') ? Colors.Common.SelectColor : undefined
        }}
        onClick={() => on({ action: 'bold' })}
      >
        <span
          style={{
            fontWeight: 600
          }}
        >
          B
        </span>
      </Toolbar.Item>
      <Toolbar.Item
        tooltip={t('editor.italic')}
        style={{
          color: isMarkActive('italic') ? Colors.Common.SelectColor : undefined
        }}
        onClick={() => on({ action: 'italic' })}
      >
        <span style={{ fontStyle: 'italic', fontWeight: 600 }}>i</span>
      </Toolbar.Item>
      <Toolbar.Item
        tooltip={t('editor.underline')}
        style={{
          color: isMarkActive('underline') ? Colors.Common.SelectColor : undefined
        }}
        onClick={() => on({ action: 'underline' })}
      >
        <span style={{ textDecoration: 'underline', fontWeight: 600 }}>U</span>
      </Toolbar.Item>
      <Toolbar.Item
        tooltip={t('editor.code')}
        iconName="park-code"
        size={13}
        style={{
          padding: '0px 6px',
          color: isMarkActive('code') ? Colors.Common.SelectColor : undefined
        }}
        onClick={() => on({ action: 'code' })}
      />
      <Toolbar.Item style={{ padding: '0px 6px' }} tooltip={t('editor.font color')}>
        <IconWithPopover
          withClickCover={true}
          placement={['bottom']}
          renderOnParent={false}
          align="start"
          zIndex={Zindexes.EditorSelectionToolbar + 10}
          size={15}
          style={{
            color: getMark('fontColor'),
            background: getMark('backgroundColor'),
            borderRadius: 2
          }}
          content={
            <BlockColorPicker
              onPickBackgroundColor={f => on({ action: 'changeBackgroundColor', backgroundColor: f })}
              onPickFontColor={f => on({ action: 'changeFontColor', fontColor: f })}
            />
          }
          name="park-font-size-two"
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item
        tooltip={'Cloze'}
        style={{
          padding: '0px 8px',
          color: isMarkActive('cloze') ? Colors.Common.SelectColor : undefined,
          borderLeft: '1px solid var(--border-background)'
        }}
        size={13}
        iconName={'park-code-brackets'}
        onClick={e => {
          if (editor.selection) {
            on({ action: 'cloze' })
          }
        }}
      />
      <Toolbar.Item
        tooltip={'Search online'}
        style={{
          padding: '0px 8px'
        }}
        size={13}
        iconName={'park-search'}
        onClick={e => {
          if (editor.selection) {
            const str = Editor.string(editor, editor.selection)
            if (str) {
              const block = Editor.above(editor, {
                match: n => Element.isElement(n) && 'id' in n,
                at: editor.selection.anchor
              })?.[0]
              if (!block?.id) return
              editor.on({
                type: 'search',
                searchedText: str
              })
            }
          }
        }}
      />
    </Toolbar>
  )
  // only render when have noteid
  const renderFloatToolbar = () =>
    createPortal(
      <AnimatePopover
        borderRadius={5}
        padding={10}
        visible={!!(floatPosition?.visible && showToolbar !== false)}
        position={{
          left: floatPosition?.left,
          top: floatPosition?.top
        }}
        positions={[floatPosition?.direction || 'top']}
        containerStyle={{ zIndex: String(Zindexes.EditorSelectionToolbar), borderRadius: 5 }}
        content={
          <WithBorder
            borderRadius={5}
            className={css({
              width: 'fit-content'
            })}
          >
            <motion.div key={3}>{renderToolbar()}</motion.div>
          </WithBorder>
        }
      />,
      document.body,
      'editorToolbar'
    )

  return renderFloatToolbar()
}

export default memo(EditorToolbar)
