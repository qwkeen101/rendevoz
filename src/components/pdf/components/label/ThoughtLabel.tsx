import { Content, Icon } from '@/components'
import { useTheme, useToggle } from '@/hooks'
import { FC, memo, RefObject, useEffect, useRef, useState } from 'react'
import { IThoughtLabel } from '~/typings/data'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { PrimitiveAtom, useAtom } from 'jotai'
import { css } from '@emotion/css'
import { PdfScope } from '@/jotai/jotaiScope'
import useDocumentStore from '@/stores/document.store'
import useNoteStore from '@/stores/note.store'
import useMetaStore from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
interface ThoughtLabelProps {
  thoughtAtom: PrimitiveAtom<IThoughtLabel>
  onDelete: () => void
  dragBoundRef: RefObject<HTMLDivElement>
}

const positions = ['top', 'right', 'bottom', 'left']
const ThoughtLabel: FC<ThoughtLabelProps> = ({ thoughtAtom, onDelete, dragBoundRef }) => {
  const [thought, setThought] = useAtom(thoughtAtom, PdfScope)
  const { id, color, icon, content, rect } = thought
  const [movable, toggleMovable] = useToggle(true)
  const [isOpen, toggleOpen] = useToggle(false)
  const isDragging = useRef(false)
  const { defaultFontColorGrey, defaultFontColorBlack } = useTheme('defaultFontColorGrey', 'defaultFontColorBlack')
  const longContentRef = useRef<HTMLDivElement>(null)
  const heightRef = useRef(0)
  const dragControls = useDragControls()
  const { getDocumentById } = useDocumentStore()
  const { getNoteById } = useNoteStore()
  const { getMetaObjectById } = useMetaStore()
  const [title, setTitle] = useState<string>()
  useEffect(() => {
    if (thought.originId) {
      if (thought.originFrom === 'editor') {
        setTitle('A note')
      }
      if (thought.originFrom === 'pdf') {
        setTitle(getDocumentById(thought.originId)?.metadata?.title || getDocumentById(thought.originId)?.name)
      }
      if (thought.originFrom === 'meta') {
        getMetaObjectById(thought.originId).then(obj => {
          setTitle(obj?.keyword)
          setThought({ ...thought, content: obj?.description })
        })
      }
    }
  }, [thought.id])
  const renderOpenableContent = () => {
    return (
      <motion.div
        onClick={() => {
          if (!isDragging.current) {
            toggleOpen()
          }
        }}
        className={css({
          display: 'flex',
          overflow: 'hidden',
          pointerEvents: 'auto',
          borderRadius: 15,
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.8)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(5px)',
          padding: '6px',
          width: 300
        })}
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          onPointerDown={e => {
            dragControls.start(e)
          }}
          className={css({
            color: defaultFontColorGrey,
            cursor: 'grab',
            userSelect: 'none'
          })}
        >
          <span
            className={css({
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            })}
          >
            <span>
              {thought.originFrom === 'editor' && '📝'}
              {thought.originFrom === 'pdf' && '📚'}
              {thought.originFrom === 'meta' && '💡'}
            </span>
            <span style={{ fontSize: '0.8rem', marginLeft: 5 }}>{title}</span>
          </span>
          <motion.div
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <Icon
              size={16}
              name="park-more"
              className={css({
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                padding: 3,
                marginTop: 5,
                marginRight: 5,
                marginLeft: 5,
                borderRadius: 999,
                top: 3,
                ':hover': {
                  background: 'rgba(0,0,0,0.07)'
                }
              })}
            />
          </motion.div>
        </Content>
        <motion.div
          onClick={e => {
            if (!window.getSelection()?.isCollapsed) {
              e.stopPropagation()
              console.log(e)
            }
          }}
          className={css({
            color: defaultFontColorBlack,
            overflow: 'hidden',
            wordBreak: 'break-all',
            textOverflow: 'ellipsis',
            position: 'relative',
            cursor: 'pointer'
          })}
        >
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                key="long"
                ref={longContentRef}
                style={{ minHeight: 50 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, position: 'absolute' }}
                initial={{ opacity: 0, height: 50 }}
                onAnimationComplete={() => {
                  heightRef.current = longContentRef.current!.getBoundingClientRect().height
                }}
              >
                {thought.content}
              </motion.div>
            ) : (
              <motion.div
                key="short"
                initial={{ opacity: 0, height: heightRef.current }}
                animate={{ opacity: 1, height: 50 }}
                exit={{ opacity: 0, position: 'absolute' }}
                className={ClassName.ellipsisFont(2)}
              >
                {thought.content?.slice(0, 100)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ top: `${rect[0] * 100}%`, left: `${rect[1] * 100}%` }}
      drag={movable}
      style={{ position: 'absolute', pointerEvents: 'auto', zIndex: 100 }}
      dragConstraints={dragBoundRef}
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragListener={false}
      onDragStart={e => {
        isDragging.current = true
      }}
      onDragEnd={(e, info) => {
        setTimeout(() => {
          isDragging.current = false
          console.log(thought)
        }, 100)
        const { point } = info
        const bound = dragBoundRef.current?.getBoundingClientRect()
        if (bound) {
          const relX = point.x - bound?.x
          const relY = point.y - bound?.y
          setThought({
            ...thought,
            rect: [relY / bound.height, relX / bound.width]
          })
        }
      }}
    >
      {renderOpenableContent()}
    </motion.div>
  )
}

export default memo(ThoughtLabel)
