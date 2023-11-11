import { AnimatePopover, Toolbar, WithBorder } from '@/components/base'
import Select from '@/components/base/select'
import IconWithPopover from '@/components/base/IconWithPopover'
import { CSSProperties, FC, useEffect, useMemo, useRef, useState } from 'react'
import { Editor, Element, Range, Transforms } from 'slate'
import { ReactEditor, useSlate } from '../../slate-react'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BlockColorPicker from '../BlockColorPicker'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import { Colors, Zindexes } from '@/consts'
import useEditorInstance from '../../hooks/useEditorInstance'
import { EditorProps } from '~/typings'
import { EditorStateAtom } from '@/core/editor/hooks/useEditorState'
import useReadOnlyEditor from '@/core/editor/hooks/useReadOnly'

type EditorToolbarEvents =
  | {
      action: 'redo' | 'undo' | 'bold' | 'italic' | 'underline' | 'code' | 'link' | 'highlight'
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
  on: (event: EditorToolbarEvents) => void
  style?: CSSProperties
}
const MAX_TOLERANT_DISTANCE = 15
const EditorToolbar: FC<EditorToolbarProps> = ({ scrollElement, style, on }) => {
  const showToolbar = useSelectAtomValue(EditorStateAtom, s => s.layout?.showToolbar)
  const toolbarOptions = useSelectAtomValue(EditorStateAtom, s => s.toolbar)
  const { t } = useTranslation()
  const editor = useSlate()
  const { selection } = editor
  const toolbarRef = useRef<HTMLElement>(null)
  const position = 'float'
  const [floatPosition, setFloatPosition] = useState<{
    top: number
    left: number
    direction: 'top' | 'bottom'
    visible: boolean
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
    currentElement = selection ? Editor.node(editor, selection?.anchor?.path, { depth: 1 }) : null
  } catch (e) {
    console.error(e)
  }
  editor.onHighlightClick = id => {
    const location = instance.getHighlightLocation?.(id)
    if (location?.length) {
      const first = location[0]
      const last = location[location.length - 1]
      const range = Editor.range(editor, first[1], last[1])
      if (range) {
        const domRange = ReactEditor.toDOMRange(editor, range)
        const bounding = domRange.getBoundingClientRect()
        Transforms.setSelection(editor, range)
        editor.selection = range

        isOnHighlightRef.current = true
        setFloatPosition({
          direction: 'top',
          left: bounding.left + bounding.width / 2,
          top: bounding.top,
          visible: true
        })
      }
    }
  }
  const handleMouseUp = useMemoizedFn((e: MouseEvent) => {
    const { selection } = editor
    const windowSelection = window.getSelection()
    if (!ReactEditor.toDOMNode(editor, editor).contains(e.target)) return
    if (
      showToolbar !== false &&
      selection &&
      windowSelection &&
      (ReactEditor.isFocused(editor) || readOnly) &&
      windowSelection.toString().length > 0 &&
      !Range.isCollapsed(selection) &&
      !toolbarRef.current?.contains(e.target)
    ) {
      const targetNode = Editor.node(editor, selection)
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

  const handleMouseDown = (e: MouseEvent) => {
    if (!toolbarRef.current?.contains(e.target)) {
      window.getSelection()?.empty()
      setFloatPosition(s => ({ ...s, visible: false }))
      isOnHighlightRef.current = false
    } else {
      if (isOnHighlightRef.current === false) {
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(ReactEditor.toDOMRange(editor, editor.selection))
      }
    }
  }
  const handleScroll = e => {
    setFloatPosition(s => ({ ...s, visible: false }))
  }
  useEffect(() => {
    if (floatPosition?.visible && editor.selection && !isOnHighlightRef.current) {
      window.getSelection()?.removeAllRanges()
      try {
        window.getSelection()?.addRange(ReactEditor.toDOMRange(editor, editor.selection))
      } catch (e) {
        console.error(e)
      }
    }
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
    <Toolbar innerRef={toolbarRef} className={classNames(styles.toolbar, styles.float)} style={style} itemClickPreventDefault itemSize={16}>
      {toolbarOptions?.highlight !== false && !disableShowHighlight && (
        <Toolbar.Item
          tooltip={t('general.highlight')}
          iconName="park-high-light"
          onClick={() => on({ action: 'highlight' })}
          isActive={isMarkActive('highlight')}
        />
      )}

      <Toolbar.Item
        tooltip={t('editor.bold')}
        isActive={isMarkActive('bold')}
        iconName="park-text-bold"
        onClick={() => on({ action: 'bold' })}
      />
      <Toolbar.Item
        tooltip={t('editor.italic')}
        isActive={isMarkActive('italic')}
        iconName="park-text-italic"
        onClick={() => on({ action: 'italic' })}
      />
      <Toolbar.Item
        tooltip={t('editor.underline')}
        isActive={isMarkActive('underline')}
        iconName="park-text-underline"
        onClick={() => on({ action: 'underline' })}
      />
      <>
        <Toolbar.Item
          tooltip={t('editor.link')}
          iconName="park-link"
          onClick={() => {
            on({ action: 'link' })
            setFloatPosition(s => ({ ...s, visible: false }))
          }}
        />
        <Toolbar.Item
          tooltip={t('editor.code')}
          isActive={isMarkActive('code')}
          iconName="park-code"
          onClick={() => on({ action: 'code' })}
        />
      </>
      <Toolbar.Item tooltip={t('editor.font color')}>
        <IconWithPopover
          placement={['bottom']}
          align="start"
          zIndex={Zindexes.EditorSelectionToolbar}
          size={16}
          style={{
            color: getMark('fontColor'),
            background: getMark('backgroundColor'),
            borderRadius: 4,
            padding: 2
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
      {toolbarOptions?.extra !== false && (
        <>
          <Toolbar.Separator direction="horizontal" />
          {/*<Toolbar.Item*/}
          {/*  iconName="park-translate"*/}
          {/*  tooltip={t('general.translate')}*/}
          {/*  onClick={e => {*/}
          {/*    if (editor.selection) {*/}
          {/*      const str = Editor.string(editor, editor.selection)*/}
          {/*      if (str) {*/}
          {/*        const block = Editor.above(editor, {*/}
          {/*          match: n => Element.isElement(n) && 'id' in n,*/}
          {/*          at: editor.selection.anchor*/}
          {/*        })?.[0]*/}
          {/*        if (!block?.id) return*/}
          {/*        editor.on({*/}
          {/*          type: 'translate',*/}
          {/*          translatedText: str,*/}
          {/*          blockId: block.id as number,*/}
          {/*          e*/}
          {/*        })*/}
          {/*      }*/}
          {/*    }*/}
          {/*  }}*/}
          {/*/>*/}
          <Toolbar.Item
            iconName="park-search"
            tooltip={t('general.search')}
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
        </>
      )}
    </Toolbar>
  )
  // only render when have noteid
  const renderFloatToolbar = () =>
    createPortal(
      <AnimatePopover
        borderRadius={999}
        padding={10}
        visible={!!(floatPosition?.visible && showToolbar !== false)}
        position={{
          left: floatPosition?.left,
          top: floatPosition?.top
        }}
        positions={[floatPosition?.direction || 'top']}
        containerStyle={{ zIndex: String(Zindexes.EditorSelectionToolbar), borderRadius: '999px' }}
        content={
          <WithBorder
            borderRadius={999}
            padding="0px 12px"
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

export default EditorToolbar
