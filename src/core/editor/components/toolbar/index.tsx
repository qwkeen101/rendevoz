import { Toolbar, WithBorder } from '@/components/base'
import Select from '@/components/base/select'
import IconWithPopover from '@/components/base/IconWithPopover'
import { CSSProperties, FC, useEffect, useRef, useState } from 'react'
import { Editor, Node, NodeEntry, Range, Transforms } from 'slate'
import { ReactEditor, useSlate } from '../../slate-react'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BlockColorPicker from '../BlockColorPicker'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import { useMemoizedFn } from '@/hooks'
import { TextSelectionTranslate } from '@/core/pdf/components/toolbar/TextSelectionToolbar'
import { CustomText } from '~/typings/editor/baseTypes'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'

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
  showToolbar?: boolean
  on: (event: EditorToolbarEvents) => void
  style?: CSSProperties
}
const MAX_TOLERANT_DISTANCE = 15
const EditorToolbar: FC<EditorToolbarProps> = ({ scrollElement, showToolbar, style, on }) => {
  const { t } = useTranslation()
  const isReading = useReadOnlyEditor()
  const editor = useSlate()
  const { selection } = editor
  const currentElement = selection ? Editor.node(editor, selection?.anchor?.path, { depth: 1 }) : null
  const toolbarRef = useRef<HTMLElement>(null)
  const position = 'float'
  const [floatPosition, setFloatPosition] = useState<{
    top: number
    left: number
    direction: string
  }>()
  const isOnHighlightRef = useRef(false)
  editor.onHighlightClick = id => {
    const texts = Node.texts(editor)
    const nodeEntries: NodeEntry[] = []
    for (const value of texts) {
      if ((value[0] as CustomText).highlight && (value[0] as CustomText).highlight === id) nodeEntries.push(value)
    }
    const startNodeEntry = nodeEntries[0]
    const endNodeEntry = nodeEntries[nodeEntries.length - 1]
    const startNodePath = startNodeEntry[1]
    const endNodePath = endNodeEntry[1]
    const startNodePoint = Editor.start(editor, startNodePath)
    const endNodePoint = Editor.end(editor, endNodePath)
    const anchorPoint = ReactEditor.toDOMPoint(editor, startNodePoint)
    const focusPoint = ReactEditor.toDOMPoint(editor, endNodePoint)
    const range = document.createRange()
    range.setStart(anchorPoint[0], anchorPoint[1])
    range.setEnd(focusPoint[0], focusPoint[1])
    const bounding = range.getBoundingClientRect()
    isOnHighlightRef.current = true
    Transforms.setSelection(editor, {
      anchor: startNodePoint,
      focus: endNodePoint
    })
    editor.selection = {
      anchor: startNodePoint,
      focus: endNodePoint
    }
    setFloatPosition({
      direction: 'top',
      left: bounding.left + bounding.width / 2,
      top: bounding.top - 50
    })
  }
  const handleMouseUp = useMemoizedFn((e: MouseEvent) => {
    const { selection, readonly } = editor
    const windowSelection = window.getSelection()
    if (
      (showToolbar || !readonly) &&
      selection &&
      windowSelection &&
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
        left: focusRect.left + 30,
        top: focusRect.top - (direction === 'top' ? 50 : -(focusRect.height + 10)),
        direction
      })
    }
  })

  const handleMouseDown = (e: MouseEvent) => {
    if (!toolbarRef.current?.contains(e.target)) {
      window.getSelection()?.empty()
      setFloatPosition(undefined)
      isOnHighlightRef.current = false
    } else {
      if (isOnHighlightRef.current === false) {
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(ReactEditor.toDOMRange(editor, editor.selection))
      }
    }
  }
  const handleScroll = e => {
    setFloatPosition(undefined)
  }
  useEffect(() => {
    if (floatPosition && editor.selection && !isOnHighlightRef.current) {
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(ReactEditor.toDOMRange(editor, editor.selection))
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
    const marks = Editor.marks(editor)
    return marks ? format in marks && marks[format] !== undefined : false
  }

  const getMark = (mark: string) => {
    const marks = Editor.marks(editor)
    return marks ? marks[mark] : undefined
  }

  const renderToolbar = () => (
    <Toolbar innerRef={toolbarRef} className={classNames(styles.toolbar, styles.float)} style={style} itemClickPreventDefault itemSize={16}>
      <Toolbar.Item tooltip={t('editor.undo')} iconName="park-return" onClick={() => on({ action: 'undo' })} />
      <Toolbar.Item tooltip={t('editor.redo')} iconName="park-go-on" onClick={() => on({ action: 'redo' })} />
      {currentElement &&
        !['heading-one', 'heading-two', 'heading-three', 'heading-four', 'heading-five', 'heading-six'].includes(
          currentElement[0].type
        ) && (
          <Select
            menuPosition="bottom"
            closeOnSelect
            hideUnderlineWhenNotHover
            disabled={
              currentElement &&
              ['heading-one', 'heading-two', 'heading-three', 'heading-four', 'heading-five', 'heading-six'].includes(
                currentElement[0].type
              )
            }
            value={getMark('fontSize') || 'default'}
            defaultValue={t('editor.default font')}
            menuStyle={{ width: 90, minWidth: 70 }}
            style={{ width: 80, margin: '0px 0px 0px 10px', padding: '0 8px' }}
            onSelect={value => on({ action: 'changeFontSize', fontSize: value[0] })}
            options={[
              {
                value: 'default',
                children: t('editor.default font')
              },
              {
                value: '14px',
                children: '14px'
              },
              {
                value: '16px',
                children: '16px'
              },
              {
                value: '20px',
                children: '20px'
              },
              {
                value: '24px',
                children: '24px'
              },
              {
                value: '28px',
                children: '28px'
              },
              {
                value: '32px',
                children: '32px'
              },
              {
                value: '36px',
                children: '36px'
              },
              {
                value: '40px',
                children: '40px'
              },
              {
                value: '50px',
                children: '50px'
              }
            ]}
          ></Select>
        )}
      {isReading && (
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
      <Toolbar.Item tooltip={t('editor.link')} iconName="park-link" onClick={() => on({ action: 'link' })} />
      <Toolbar.Item
        tooltip={t('editor.code')}
        isActive={isMarkActive('code')}
        iconName="park-code"
        onClick={() => on({ action: 'code' })}
      />
      <Toolbar.Item tooltip={t('editor.font color')}>
        <IconWithPopover
          placement={['bottom']}
          align="start"
          zIndex={9999}
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
      {isReading && (
        <>
          <Toolbar.Separator direction="horizontal" />
          <Toolbar.Item>
            <IconWithPopover
              placement={['top']}
              tooltip={t('general.translate')}
              align="center"
              zIndex={9999}
              size={16}
              content={
                <WithBorder padding={8}>
                  <TextSelectionTranslate
                    translateInput={editor.selection ? Editor.string(editor, editor.selection) : 'Text Not Selected'}
                  />
                </WithBorder>
              }
              name="park-translate"
            ></IconWithPopover>
          </Toolbar.Item>
        </>
      )}
    </Toolbar>
  )

  // only render when have noteid
  const renderFloatToolbar = () =>
    createPortal(
      <AnimatePresence>
        {floatPosition && editor.noteId && (
          <motion.div
            key="editorTool"
            style={{
              position: 'fixed',
              top: floatPosition.top,
              left: floatPosition.left,
              zIndex: 9999
            }}
          >
            <WithBorder
              borderRadius={999}
              padding="0px 12px"
              style={{
                border: 'none'
              }}
              className={css({
                position: 'sticky',
                marginLeft: 'auto',
                marginRight: 'auto',
                width: 'fit-content',
                transform: 'translateX(-50%)'
              })}
            >
              <motion.div
                key={2}
                style={{ position: 'absolute', inset: 1, borderRadius: 999 }}
                initial={{ opacity: 0, y: floatPosition.direction === 'top' ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: floatPosition.direction === 'top' ? -20 : 20 }}
                className={ClassName.Background.blurBackground}
              ></motion.div>
              <motion.div
                key={3}
                initial={{ opacity: 0, y: floatPosition.direction === 'top' ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: floatPosition.direction === 'top' ? -20 : 20 }}
              >
                {renderToolbar()}
              </motion.div>
            </WithBorder>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      'editorToolbar'
    )

  return position === 'float' ? renderFloatToolbar() : renderToolbar()
}

export default EditorToolbar
