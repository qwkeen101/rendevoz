import { css } from '@emotion/css'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { ImageElement } from '~/typings'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components'
import { Transforms } from 'slate'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import { saveImageLocally } from '@/utils/img'
import Id from '@/utils/id'

const Image = ({ element, children }: RenderElementProps) => {
  const imageEle = element as ImageElement
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [maskVisible, setMaskVisible] = useState(false)
  const readOnly = useReadOnlyEditor()
  const editor = useSlateStatic()
  useEffect(() => {
    if (imageEle.url.startsWith('http')) {
      console.log(imageEle.url)
      fetch(imageEle.url, {
        method: 'GET',
        referrer: ''
      })
        .then(res => res.blob())
        .then(blob => {
          saveImageLocally(Id.getStrId(), blob).then(data => {
            console.log(data)
            Transforms.setNodes(
              editor,
              {
                url: data.data
              },
              {
                at: ReactEditor.findPath(editor, imageEle)
              }
            )
          })
        })
    }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: imageEle.align || 'center' }}>
      {children}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setMaskVisible(true)}
        onMouseLeave={() => setMaskVisible(false)}
        contentEditable={false}
        className={css({
          width: imageEle.width || '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          position: 'relative'
        })}
      >
        {!readOnly && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: 10,
                color: 'white',
                opacity: maskVisible ? 1 : 0,
                transition: 'opacity 0.2s ease',
                fontSize: 16
              }}
              className={css({
                '> div': {
                  padding: '4px 6px',
                  background: 'rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  ':hover': {
                    background: 'rgba(0,0,0,0.2)'
                  },
                  ':first-child': {
                    borderTopLeftRadius: '4px',
                    borderBottomLeftRadius: '4px',
                    borderRight: '1px solid rgba(255,255,255,0.2)'
                  },
                  ':last-child': {
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px',
                    borderLeft: '1px solid rgba(255,255,255,0.2)'
                  }
                }
              })}
            >
              <Icon
                name="park-align-left"
                onClick={() => {
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(editor, { align: 'left' }, { at: path })
                }}
              />
              <Icon
                name="park-horizontally-centered"
                onClick={() => {
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(editor, { align: 'center' }, { at: path })
                }}
              />
              <Icon
                name="park-align-right"
                onClick={() => {
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(editor, { align: 'right' }, { at: path })
                }}
              />
            </div>
            <motion.div
              role="img-resizer-left"
              drag="x"
              initial={{ opacity: 0 }}
              animate={{ opacity: maskVisible ? 1 : 0 }}
              dragConstraints={{ left: 0, right: 0 }}
              dragMomentum={false}
              dragElastic={false}
              whileDrag={{ opacity: 1 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 15,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onDrag={(e, info) => {
                const prevWidth = parseInt(window.getComputedStyle(imageContainerRef.current).width)
                const newWidth = prevWidth - info.delta.x
                if (newWidth > 200) {
                  imageContainerRef.current?.style.setProperty('width', `${newWidth}px`)
                }
              }}
              onDragEnd={() => {
                const currentWidth = parseInt(imageContainerRef.current?.style.width || '0')
                if (currentWidth) {
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(
                    editor,
                    {
                      width: currentWidth
                    },
                    {
                      at: path
                    }
                  )
                }
              }}
            >
              <div
                style={{
                  background: 'rgba(0,0,0,0.8)',
                  width: 6,
                  height: 80,
                  maxHeight: '50%',
                  border: '1px solid white',
                  borderRadius: 20
                }}
              ></div>
            </motion.div>
            <motion.div
              role="img-resizer-right"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: maskVisible ? 1 : 0 }}
              whileDrag={{ opacity: 1 }}
              dragElastic={false}
              dragMomentum={false}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 15,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onDrag={(e, info) => {
                const prevWidth = parseInt(window.getComputedStyle(imageContainerRef.current).width)
                const newWidth = prevWidth + info.delta.x
                if (newWidth > 200) {
                  imageContainerRef.current?.style.setProperty('width', `${newWidth}px`)
                }
              }}
              onDragEnd={() => {
                const currentWidth = parseInt(imageContainerRef.current?.style.width || '0')
                if (currentWidth) {
                  const path = ReactEditor.findPath(editor, element)
                  Transforms.setNodes(
                    editor,
                    {
                      width: currentWidth
                    },
                    {
                      at: path
                    }
                  )
                }
              }}
            >
              {' '}
              <div
                style={{
                  background: 'rgba(0,0,0,0.8)',
                  width: 6,
                  height: 80,
                  maxHeight: '50%',
                  border: '1px solid white',
                  borderRadius: 20
                }}
              ></div>
            </motion.div>
          </>
        )}
        <img
          style={{
            width: imageEle.width
          }}
          className={css({
            objectFit: 'cover',
            borderRadius: 10,
            width: '100%'
            // maxWidth: 400
          })}
          draggable={true}
          src={imageEle.url}
        />
      </div>
    </div>
  )
}
export default Image
