import { Noop } from '@/common/types'
import { ColorPicker, Icon } from '@/components'
import { Toolbar, WithBorder } from '@/components/base'
import Select from '@/components/base/select'
import IconWithPopover from '@/components/base/IconWithPopover'
import { CSSProperties, FC, useEffect, useRef, useState } from 'react'
import { Editor, Range, Selection } from 'slate'
import { ReactEditor, useSlate } from '../../slate-react'
import styles from './index.module.less'
import { useTranslation } from 'react-i18next'
import classNames from 'classnames'
import { Position } from '@/types'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSetting } from '@/hooks'

interface EditorToolbarProps {
  fontSize?: number
  alignment?: string
  scrollElement?: HTMLElement | null
  onRedo: Noop
  onUndo: Noop
  onBold: Noop
  onItalic: Noop
  onUnderline: Noop
  onMetaObject: Noop
  onLink: Noop
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
  onLink,
  onMetaObject,
  scrollElement,
  style
}) => {
  const { t } = useTranslation()
  const editor = useSlate()
  const { selection } = editor
  const [setting] = useSetting()
  const position = setting.editor.toolbarPosition
  const currentElement = selection ? Editor.node(editor, selection?.anchor?.path, { depth: 1 }) : null
  const toolbarRef = useRef<HTMLElement>(null)
  const [floatPosition, setFloatPosition] = useState<{
    top: number
    left: number
    direction: string
  }>()
  const handleMouseUp = (e: MouseEvent) => {
    const { selection } = editor
    const windowSelection = window.getSelection()
    if (
      selection &&
      windowSelection &&
      windowSelection.toString().length > 0 &&
      !Range.isCollapsed(selection) &&
      !toolbarRef.current?.contains(e.target)
    ) {
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
        left: focusRect.left,
        top: focusRect.top - (direction === 'top' ? 50 : -(focusRect.height + 10)),
        direction
      })
    }
  }
  const handleMouseDown = (e: MouseEvent) => {
    if (!toolbarRef.current?.contains(e.target)) {
      window.getSelection()?.empty()
      setFloatPosition(undefined)
    } else {
      window.getSelection()?.addRange(ReactEditor.toDOMRange(editor, selection))
    }
  }
  const handleScroll = e => {
    setFloatPosition(undefined)
  }
  useEffect(() => {
    if (position === 'float') {
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('mousedown', handleMouseDown)
      scrollElement?.addEventListener('scroll', handleScroll)
      return () => {
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('mousedown', handleMouseDown)
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
    return marks ? (marks['fontSize'] ? marks['fontSize'] : '14px') : '16px'
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
    <Toolbar
      innerRef={toolbarRef}
      className={classNames(
        styles.toolbar,
        position === 'float' && styles.float,
        position === 'top' && styles.top,
        position === 'bottom' && styles.bottom
      )}
      style={style}
      itemClickPreventDefault
      itemSize={16}
    >
      <Toolbar.Item tooltip={t('editor.undo')} iconName="park-return" onClick={onUndo} />
      <Toolbar.Item tooltip={t('editor.redo')} iconName="park-go-on" onClick={onRedo} />
      {currentElement &&
        !['heading-one', 'heading-two', 'heading-three', 'heading-four', 'heading-five', 'heading-six'].includes(
          currentElement[0].type
        ) && (
          <Select
            menuPosition={position === 'top' ? 'bottom' : position === 'bottom' ? 'top' : 'bottom'}
            closeOnSelect
            hideUnderlineWhenNotHover
            disabled={
              currentElement &&
              ['heading-one', 'heading-two', 'heading-three', 'heading-four', 'heading-five', 'heading-six'].includes(
                currentElement[0].type
              )
            }
            value={getFontSize()}
            defaultValue="14px"
            menuStyle={{ width: 90, minWidth: 70 }}
            style={{ width: 80, margin: '0px 0px 0px 10px', padding: '0 8px' }}
            onSelect={value => {
              onChangeFontSize(value[0])
            }}
          >
            <Select.Option value="14px">14px</Select.Option>
            <Select.Option value="16px">16px</Select.Option>
            <Select.Option value="20px">20px</Select.Option>
            <Select.Option value="24px">24px</Select.Option>
            <Select.Option value="28px">28px</Select.Option>
            <Select.Option value="32px">32px</Select.Option>
            <Select.Option value="36px">36px</Select.Option>
            <Select.Option value="40px">40px</Select.Option>
            <Select.Option value="50px">50px</Select.Option>
            <Select.Option value="60px">60px</Select.Option>
          </Select>
        )}
      <Toolbar.Item>
        <IconWithPopover
          disableIntersection
          tooltip={t('editor.font color')}
          placement={['top', 'bottom']}
          size={16}
          name="park-font-size-two"
          color={getFontColor()}
          content={
            <WithBorder>
              <ColorPicker onPick={onChangeFontColor} />
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item>
        <IconWithPopover
          disableIntersection
          tooltip={'Background color'}
          placement={['top', 'bottom']}
          size={16}
          name="park-background-color"
          color={getBackgroundColor()}
          content={
            <WithBorder>
              <ColorPicker backDefault onPick={onChangeBackgroundColor} />
            </WithBorder>
          }
        ></IconWithPopover>
      </Toolbar.Item>
      <Toolbar.Item tooltip={t('editor.bold')} isActive={isMarkActive('bold')} iconName="park-text-bold" onClick={onBold} />
      <Toolbar.Item tooltip={t('editor.italic')} isActive={isMarkActive('italic')} iconName="park-text-italic" onClick={onItalic} />
      <Toolbar.Item
        tooltip={t('editor.underline')}
        isActive={isMarkActive('underline')}
        iconName="park-text-underline"
        onClick={onUnderline}
      />
      <Toolbar.Item tooltip="Turn to Meta object" iconName="park-share-one" onClick={onMetaObject} />
      <Toolbar.Item tooltip="Turn to Link" iconName="park-link" onClick={onLink} />
    </Toolbar>
  )
  const renderFloatToolbar = () =>
    createPortal(
      <AnimatePresence>
        {floatPosition && (
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
