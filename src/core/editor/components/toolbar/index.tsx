import { Noop } from '@/common/types'
import { Toolbar, WithBorder } from '@/components/base'
import Select from '@/components/base/select'
import IconWithPopover from '@/components/base/IconWithPopover'
import { CSSProperties, FC, useEffect, useRef, useState } from 'react'
import { Editor, Range, Transforms } from 'slate'
import { ReactEditor, useSlate } from '../../slate-react'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BlockColorPicker from '../BlockColorPicker'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import { TextSelectionTranslate } from '@/core/pdf/components/toolbar/TextSelectionToolbar'

interface EditorToolbarProps {
  fontSize?: number
  alignment?: string
  scrollElement?: HTMLElement | null
  showToolbar?: boolean
  onRedo: Noop
  onUndo: Noop
  onBold: Noop
  onItalic: Noop
  onUnderline: Noop
  onLink: Noop
  onHighlight: VoidFunction
  onChangeFontSize: (fontSize: string) => void
  onChangeFontColor: (color: string) => void
  onChangeBackgroundColor: (color: string) => void
  style?: CSSProperties
}
const MAX_TOLERANT_DISTANCE = 15
const EditorToolbar: FC<EditorToolbarProps> = ({
  onRedo,
  onUndo,
  onBold,
  onItalic,
  onUnderline,
  onChangeFontSize,
  onChangeFontColor,
  onChangeBackgroundColor,
  onHighlight,
  scrollElement,
  showToolbar,
  style
}) => {
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
    const nodes = Array.from(ReactEditor.toDOMNode(editor, editor).querySelectorAll(`[data-highlight="${id}"]`))
    const startSlateNode = ReactEditor.toSlateNode(editor, nodes[0])
    const endSlateNode = ReactEditor.toSlateNode(editor, nodes[nodes.length - 1])
    const startNodePath = ReactEditor.findPath(editor, startSlateNode)
    const endNodePath = ReactEditor.findPath(editor, endSlateNode)
    const startNodePoint = Editor.start(editor, startNodePath)
    const endNodePoint = Editor.end(editor, endNodePath)
    const anchorPoint = ReactEditor.toDOMPoint(editor, startNodePoint)
    const focusPoint = ReactEditor.toDOMPoint(editor, endNodePoint)
    const range = document.createRange()
    range.setStart(anchorPoint[0], anchorPoint[1])
    range.setEnd(focusPoint[0], focusPoint[1])
    const bounding = range.getBoundingClientRect()
    isOnHighlightRef.current = true
    console.log(startNodePoint, endNodePoint)
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
    return marks ? marks[format] === true : false
  }
  const getFontSize = () => {
    const marks = Editor.marks(editor)
    return marks ? (marks['fontSize'] ? marks['fontSize'] : 'default') : 'default'
  }
  const getFontColor = () => {
    const marks = Editor.marks(editor)
    return marks ? marks['fontColor'] : undefined
  }
  const getBackgroundColor = () => {
    const marks = Editor.marks(editor)
    return marks ? marks['backgroundColor'] : undefined
  }
  const renderToolbar = () => (
    <Toolbar innerRef={toolbarRef} className={classNames(styles.toolbar, styles.float)} style={style} itemClickPreventDefault itemSize={16}>
      <Toolbar.Item tooltip={t('editor.undo')} iconName="park-return" onClick={onUndo} />
      <Toolbar.Item tooltip={t('editor.redo')} iconName="park-go-on" onClick={onRedo} />
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
            value={getFontSize()}
            defaultValue="default"
            menuStyle={{ width: 90, minWidth: 70 }}
            style={{ width: 80, margin: '0px 0px 0px 10px', padding: '0 8px' }}
            onSelect={value => {
              onChangeFontSize(value[0])
            }}
            options={[
              {
                value: 'default',
                children: 'default'
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
      <Toolbar.Item tooltip={t('general.highlight')} iconName="park-high-light" onClick={onHighlight} />
      <Toolbar.Item tooltip={t('editor.bold')} isActive={isMarkActive('bold')} iconName="park-text-bold" onClick={onBold} />
      <Toolbar.Item tooltip={t('editor.italic')} isActive={isMarkActive('italic')} iconName="park-text-italic" onClick={onItalic} />
      <Toolbar.Item
        tooltip={t('editor.underline')}
        isActive={isMarkActive('underline')}
        iconName="park-text-underline"
        onClick={onUnderline}
      />
      <Toolbar.Item tooltip={t('editor.font color')}>
        <IconWithPopover
          placement={['bottom']}
          align="start"
          zIndex={9999}
          size={16}
          style={{
            color: getFontColor(),
            background: getBackgroundColor(),
            borderRadius: 4,
            padding: 2
          }}
          content={<BlockColorPicker onPickBackgroundColor={onChangeBackgroundColor} onPickFontColor={onChangeFontColor} />}
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
                <WithBorder style={{ padding: 8 }}>
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
            initial={{ opacity: 0, y: floatPosition.direction === 'top' ? -20 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: floatPosition.direction === 'top' ? -20 : 20 }}
            style={{
              position: 'fixed',
              top: floatPosition.top,
              left: floatPosition.left,
              zIndex: 9999
            }}
          >
            {renderToolbar()}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      'editorToolbar'
    )
  return position === 'float' ? renderFloatToolbar() : renderToolbar()
}

export default EditorToolbar
