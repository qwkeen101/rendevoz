import { Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { useTheme } from '@/hooks'
import { cloneElement, FC, memo, RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { useAtomValue } from 'jotai/react'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { Rnd } from 'react-rnd'
import StringLabel from './StringLabel'
import ImageLabel from './ImageLabel'
import NoteLabel from './NoteLabel'
import { Descendant } from 'slate'
import { atom } from 'jotai/vanilla'
import useLabelStore, { labelsAtom } from '@/stores/label.store'
import { globalStore } from '@/stores/stores'
import { IThoughtLabel } from '~/typings/data'
interface ThoughtLabelProps {
  labelId: number
  dragBoundRef: RefObject<HTMLDivElement>
}
export interface InnerLabelProps {
  content?: string
  url?: string
  noteId?: number
  noteValue?: Descendant[]
  onTitleChange?: (title: string) => void
}
const ThoughtLabel: FC<ThoughtLabelProps> = ({ labelId, dragBoundRef }) => {
  const thoughtLabelAtom = useMemo(() => atom(get => get(labelsAtom).get(labelId)), [labelId])
  const thought = useAtomValue(thoughtLabelAtom, { store: globalStore }) as IThoughtLabel | undefined
  const { updateLabel, deleteLabel } = useLabelStore()
  const { rect, size } = thought
  const isDragging = useRef(false)
  const { defaultFontColorGrey, defaultFontColorRed } = useTheme('defaultFontColorGrey', 'defaultFontColorRed')
  const dragControls = useDragControls()
  const [title, setTitle] = useState<string>()

  const renderContent = () => {
    if (!thought) return null
    switch (thought.originFrom) {
      case 'editor':
        return <NoteLabel noteValue={thought.content} noteId={thought.originId} />
      case 'pdf':
      case 'meta':
      case 'image':
        return <ImageLabel url={thought.content} />
      default:
        return <StringLabel content={thought.content} />
    }
  }
  const LabelContent = cloneElement(renderContent(), {
    onTitleChange: useCallback((title: string) => setTitle(title), [])
  })
  const renderOpenableContent = () => {
    return (
      <Rnd
        maxHeight={800}
        maxWidth={500}
        minHeight={thought.minimized ? 0 : 100}
        minWidth={150}
        size={{
          width: size?.[0] || 300,
          height: thought.minimized ? 38 : size?.[1] || 200
        }}
        onResizeStop={(e, dir, ele, s) => {
          const bound = ele.getBoundingClientRect()
          updateLabel({ id: labelId, size: [bound.width, bound.height] })
        }}
        disableDragging
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
          <span className={ClassName.ellipsisFont(1)}>
            <span style={{ fontSize: '0.8rem', marginLeft: 5, color: thought.minimized ? 'black' : undefined }}>
              {thought.title || title}
            </span>
          </span>
          <motion.div
            onClick={e => {
              e.stopPropagation()
            }}
            className={css({
              display: 'flex',
              marginLeft: 8,
              '> div': [
                ClassName.circleButton(),
                {
                  padding: 3,
                  marginRight: 5
                }
              ]
            })}
          >
            <Icon
              onClick={() => updateLabel({ id: labelId, minimized: !thought.minimized })}
              name={thought.minimized ? 'park-full-screen-two' : 'park-off-screen-two'}
            />
            <IconWithPopover
              parentElement={document.body}
              content={
                <WithBorder style={{ padding: 6, width: 150 }} onPointerDown={e => e.stopPropagation()}>
                  {thought.createTime && (
                    <div className={ClassName.description()} style={{ padding: '2px 7px' }}>
                      Created at: {DateFormat.format(thought.createTime, DateFormat.Formats.default)}
                    </div>
                  )}
                  {/* <AnimatePopover positions={['right', 'left']} padding={10} visible={settingVisible} content={renderEditThought()}>
                    <div
                      onClick={toggleSettingVisible}
                      className={css([ClassName.flatButton(), ClassName.defaultFont(undefined, 600)])}
                      style={{ display: 'flex', justifyContent: 'space-between' }}
                    >
                      Setting
                      <Icon name="park-right" />
                    </div>
                  </AnimatePopover> */}
                  <div
                    onClick={() => deleteLabel(labelId)}
                    className={css([ClassName.flatButton(), ClassName.defaultFont(undefined, 600)])}
                    style={{ color: defaultFontColorRed }}
                  >
                    Delete
                  </div>
                </WithBorder>
              }
              size={16}
              name="park-more"
            ></IconWithPopover>
          </motion.div>
        </Content>
        <div
          style={{
            height: thought.minimized ? 0 : '100%',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          {LabelContent}
        </div>
      </Rnd>
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
  if (!thought) return null
  return (
    <motion.div
      initial={{ top: `${rect[0] * 100}%`, left: `${rect[1] * 100}%` }}
      drag={true}
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
        }, 100)
        const { point } = info
        const bound = dragBoundRef.current?.getBoundingClientRect()
        if (bound) {
          const relX = point.x - bound?.x
          const relY = point.y - bound?.y
          updateLabel({
            id: labelId,
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
