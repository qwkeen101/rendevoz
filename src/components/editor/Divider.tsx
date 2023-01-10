import { useMemoizedFn } from '@/hooks'
import classNames from 'classnames'
import { PanInfo, motion, animate, AnimationPlaybackControls } from 'framer-motion'
import { FC, memo, useRef, useState } from 'react'
import { Transforms } from 'slate'
import { Path } from 'slate'
import useIsDragging, { useIsDraggingDivider } from './hooks/useIsDragging'
import styles from './index.module.less'
import { ReactEditor, useSlate } from './slate-react'

type DividerProps = {
  currentPath: Path
}
const Divider: FC<DividerProps> = memo(({ currentPath }) => {
  const [isDragging] = useIsDragging()
  const editor = useSlate()
  const dividerRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef<{
    previousColumnWidth?: number
    nextColumnWidth?: number
  }>()
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)
  const [isMouseOnDivider, setIsMouseOnDivider] = useState(true)
  const prevPrevColumnAnim = useRef<AnimationPlaybackControls>()
  const prevNextColumnAnim = useRef<AnimationPlaybackControls>()
  const handleDragStart = (e: MouseEvent) => {
    if (isDragging) return
    if (isDraggingHandle) return
    ReactEditor.deselect(editor)
    setIsDraggingHandle(true)
    const divider = dividerRef.current
    if (divider) {
      const previousColumn = divider.previousElementSibling
      const nextColumn = divider.nextElementSibling
      widthRef.current = {
        previousColumnWidth: previousColumn?.getBoundingClientRect().width,
        nextColumnWidth: nextColumn?.getBoundingClientRect().width
      }
    }
  }
  const handleDrag = (e: MouseEvent, info: PanInfo) => {
    const { x: dx, y: dy } = info.offset
    const divider = dividerRef.current
    if (divider && widthRef.current) {
      if (widthRef.current.previousColumnWidth + dx < 50 || widthRef.current.nextColumnWidth - dx < 50) {
        return
      }
      const previousColumn = divider.previousElementSibling as HTMLElement
      prevPrevColumnAnim.current?.stop()
      const s = animate(previousColumn.clientWidth, widthRef.current.previousColumnWidth + dx, {
        onUpdate: w => (previousColumn.style.width = `${w}px`),
        duration: 0.03,
        type: 'keyframes'
      })
      prevPrevColumnAnim.current = s
      prevNextColumnAnim.current?.stop()
      const nextColumn = divider.nextElementSibling as HTMLElement
      const b = animate(nextColumn.clientWidth, widthRef.current.nextColumnWidth - dx, {
        onUpdate: w => (nextColumn.style.width = `${w}px`),
        duration: 0.03,
        type: 'keyframes'
      })
      prevNextColumnAnim.current = b
    }
  }
  const handleDragEnd = useMemoizedFn((e: MouseEvent) => {
    widthRef.current = undefined
    prevNextColumnAnim.current?.stop()
    prevPrevColumnAnim.current?.stop()
    setIsDraggingHandle(false)
    const divider = dividerRef.current
    if (divider) {
      if (!divider.contains(e.target)) {
        setIsMouseOnDivider(false)
      } else {
        setIsMouseOnDivider(true)
      }
      const previousColumn = divider.previousElementSibling as HTMLElement
      const previousColumnWidth = previousColumn.clientWidth
      const nextColumn = divider.nextElementSibling as HTMLElement
      const nextColumnWidth = nextColumn.clientWidth
      const allColumnsWidth = Array.from(divider.parentElement?.querySelectorAll("[data-type='column']") || []).reduce((prev, curr) => {
        return prev + curr.getBoundingClientRect().width
      }, 0)
      const previousColumnWidthRatio = previousColumnWidth / allColumnsWidth
      const nextColumnWidthRatio = nextColumnWidth / allColumnsWidth
      const prevPath = Path.previous(currentPath)
      Transforms.setNodes(editor, { ratio: nextColumnWidthRatio }, { at: currentPath })
      Transforms.setNodes(editor, { ratio: previousColumnWidthRatio }, { at: prevPath })
    }
  })
  return (
    <>
      <motion.div
        drag="x"
        onDragEnd={handleDragEnd}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        ref={dividerRef}
        onMouseEnter={() => setIsMouseOnDivider(true)}
        whileHover={{ opacity: isMouseOnDivider ? 1 : 0, cursor: 'col-resize' }}
        style={{ opacity: isDraggingHandle ? 1 : undefined, pointerEvents: isDraggingHandle ? 'all' : isDragging ? 'none' : undefined }}
        contentEditable={false}
        className={classNames(styles.DividerWrapper)}
        transition={{ duration: 0.1 }}
      >
        <motion.div className={styles.Divider}></motion.div>
      </motion.div>
    </>
  )
})
export default Divider
