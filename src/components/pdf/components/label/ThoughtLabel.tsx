import { AnimatePopover, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { useTheme, useToggle } from '@/hooks'
import { FC, memo, RefObject, useEffect, useRef, useState } from 'react'
import { IThoughtLabel } from '~/typings/data'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { PrimitiveAtom, useAtom } from 'jotai'
import { css } from '@emotion/css'
import { PdfScope } from '@/jotai/jotaiScope'
import useDocumentStore from '@/stores/document.store'
import useMetaStore from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import Modal from '@/components/base/modal'
import DateFormat from '@/utils/dateFormat'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
interface ThoughtLabelProps {
  thoughtAtom: PrimitiveAtom<IThoughtLabel>
  onDelete: () => void
  dragBoundRef: RefObject<HTMLDivElement>
}

const ThoughtLabel: FC<ThoughtLabelProps> = ({ thoughtAtom, onDelete, dragBoundRef }) => {
  const [thought, setThought] = useAtom(thoughtAtom, PdfScope)
  const { rect } = thought
  const [movable, toggleMovable] = useToggle(true)
  const [isOpen, toggleOpen] = useToggle(false)
  const isDragging = useRef(false)
  const { defaultFontColorGrey, defaultFontColorBlack, defaultFontColorRed } = useTheme(
    'defaultFontColorGrey',
    'defaultFontColorBlack',
    'defaultFontColorRed'
  )
  const longContentRef = useRef<HTMLDivElement>(null)
  const heightRef = useRef(0)
  const dragControls = useDragControls()
  const [imageModalVisible, toggleImageModalVisible] = useToggle(false)
  const [settingVisible, toggleSettingVisible] = useToggle(false)
  const { getDocumentById } = useDocumentStore()
  const { getMetaObjectById } = useMetaStore()
  const [title, setTitle] = useState<string>()
  useEffect(() => {
    if (thought.originFrom === 'image') {
      setTitle('Image')
      toggleOpen(true)
    }
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
            if (thought.originFrom !== 'image') {
              toggleOpen()
            }
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
              {thought.originFrom === 'image' && '🖼️'}
            </span>
            <span style={{ fontSize: '0.8rem', marginLeft: 5 }}>{thought.title || title}</span>
          </span>
          <motion.div
            onClick={e => {
              e.stopPropagation()
            }}
          >
            <IconWithPopover
              parentElement={document.body}
              content={
                <WithBorder style={{ padding: 6, width: 150 }} onPointerDown={e => e.stopPropagation()}>
                  {thought.createTime && (
                    <div className={ClassName.description()} style={{ padding: '2px 7px' }}>
                      Created at: {DateFormat.format(thought.createTime, DateFormat.Formats.default)}
                    </div>
                  )}
                  <AnimatePopover positions={['right', 'left']} padding={10} visible={settingVisible} content={renderEditThought()}>
                    <div
                      onClick={toggleSettingVisible}
                      className={css([ClassName.flatButton(), ClassName.defaultFont(undefined, 600)])}
                      style={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      Setting
                      <Icon name="park-right" />
                    </div>
                  </AnimatePopover>
                  <div
                    onClick={onDelete}
                    className={css([ClassName.flatButton(), ClassName.defaultFont(undefined, 600)])}
                    style={{ color: defaultFontColorRed }}
                  >
                    Delete
                  </div>
                </WithBorder>
              }
              size={16}
              name="park-more"
              className={css([
                ClassName.circleButton(),
                {
                  padding: 3,
                  marginRight: 5,
                  marginLeft: 5
                }
              ])}
            ></IconWithPopover>
          </motion.div>
        </Content>
        <motion.div
          onClick={e => {
            if (!window.getSelection()?.isCollapsed) {
              e.stopPropagation()
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
                {thought.originFrom === 'image' ? (
                  <img style={{ borderRadius: 4 }} onClick={toggleImageModalVisible} src={thought.content} width="100%" />
                ) : (
                  thought.content
                )}
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
  const renderEditThought = () => (
    <WithBorder
      style={{ padding: 6, width: 240, display: 'flex', flexDirection: 'column', gap: 6 }}
      onClickCapture={e => e.preventDefault()}
    >
      <div className={ClassName.description()}>Title</div>
      <input
        placeholder="Title"
        value={thought.title}
        style={{ height: 36 }}
        onChange={e => {
          setThought({
            ...thought,
            title: e.target.value
          })
        }}
        className={ClassName.input()}
      />
      <div className={ClassName.description()}>Content</div>
      <AutosizeTextarea
        value={thought.content}
        className={ClassName.input()}
        style={{ resize: 'none', overflow: 'hidden' }}
        placeholder="Content"
        onChange={e => {
          setThought({
            ...thought,
            content: e.target.value
          })
        }}
      />
    </WithBorder>
  )
  return (
    <>
      <Modal width="80vw" height="80vh" visible={imageModalVisible} onClose={toggleImageModalVisible}>
        <Content fullHeight fullWidth flex centered style={{ padding: 20, overflowY: 'auto' }}>
          <img width="auto" style={{ maxWidth: '100%', borderRadius: 8 }} height="auto" src={thought.content} />
        </Content>
      </Modal>
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
    </>
  )
}

export default memo(ThoughtLabel)
