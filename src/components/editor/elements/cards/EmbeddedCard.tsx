import Id from '@/utils/id'
import { ReactNode, useRef, useState } from 'react'
import { EditorV1 } from '../../Editor'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'

const EmbeddedCard = ({ noteId, slateChildren }: { noteId?: number; slateChildren?: ReactNode }) => {
  const [id] = useState(Id.getStrId())
  const [size, setSize] = useState<{
    width?: string | number
    height?: number
  }>({
    width: '100%',
    height: 600
  })
  const ref = useRef<HTMLDivElement>(null)
  if (!noteId) return null
  return (
    <div
      contentEditable={false}
      ref={ref}
      style={{
        width: '100%',
        height: size.height,
        overflowX: 'hidden',
        overflowY: 'auto',
        borderRadius: 8,
        boxShadow: 'rgba(0, 0, 0, 0.05) 0px 6px 24px 0px, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px',
        position: 'relative'
      }}
      className={css({
        '[role="inner-editor"]': {
          padding: '12px !important'
        }
      })}
    >
      <div
        style={{
          position: 'absolute',
          userSelect: 'none',
          bottom: 5,
          width: '100%',
          height: 5,
          zIndex: 3,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <motion.div
          drag="y"
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDrag={(e, info) => {
            e.preventDefault()
            const height = ref.current?.clientHeight
            ref.current && (ref.current.style.height = `${height + info.delta.y}px`)
          }}
          onDragEnd={() => {
            const height = ref.current?.clientHeight
            setSize({
              ...size,
              height
            })
          }}
          style={{
            width: '20%',
            maxWidth: 150,
            height: 5,
            borderRadius: 999,
            cursor: 'row-resize',
            background: 'rgba(225,225,225,0.8)'
          }}
        ></motion.div>
      </div>
      <EditorV1 id={id} readonly noteId={noteId} />
      {slateChildren}
    </div>
  )
}

export default EmbeddedCard
