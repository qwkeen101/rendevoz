import { css } from '@emotion/css'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { ImageElement } from '~/typings'
import { useEffect, useRef, useState } from 'react'
import { Icon, Tooltip } from '@/components'
import { Editor, Path, Transforms } from 'slate'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import Id from './utils/id'
import { EditorStateAtom } from '../hooks/useEditorState'
import ResizableWrapper from '../ResizeWrapper'
import FileSystem from '@/api/fileSystem'
import { selectAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai'
import useEditorInstance from '../hooks/useEditorInstance'

const alreadyFetchedCache = new Set<string>()
const saveImageLocallyAtom = selectAtom(EditorStateAtom, s => s.state?.saveImgLocally)
const Image = ({ element, children }: RenderElementProps) => {
  const imageEle = element as ImageElement
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [maskVisible, setMaskVisible] = useState(false)
  const readOnly = useReadOnlyEditor()
  const editor = useSlateStatic()
  const instance = useEditorInstance()
  const shouldSaveImageLocally = useAtomValue(saveImageLocallyAtom, { store: instance.values.editorLevelStore }) ?? false

  useEffect(() => {
    if (imageEle.url?.startsWith('http')) {
      if (alreadyFetchedCache.has(imageEle.url)) return
      const currentPath = ReactEditor.findPath(editor, element)
      if (!currentPath) return
      const pathRef = Editor.pathRef(editor, currentPath)
      // if remote can be touched, don't save and remove
      fetch(imageEle.url, {
        method: 'HEAD'
      })
        .then(res => {
          alreadyFetchedCache.add(imageEle.url)
          const p = pathRef.unref()
          if (!p) return
          const contentType = res.headers.get('Content-Type')
          if (contentType === 'image/svg+xml') {
            Transforms.removeNodes(editor, {
              at: p
            })
            return
          }
          if (res.ok) {
            // delete small images (< 15kb)
            const size = res.headers.get('Content-Length')
            if (!size || Number(size) < 1024 * 10) {
              Transforms.removeNodes(editor, {
                at: p
              })
              return
            }
            if (shouldSaveImageLocally) {
              // set here to prevent request image block UI
              setTimeout(() => {
                requestIdleCallback(() => {
                  FileSystem.saveImage(imageEle.url).then(path => {
                    Transforms.setNodes(
                      editor,
                      {
                        url: path
                      },
                      {
                        at: ReactEditor.findPath(editor, imageEle)
                      }
                    )
                  })
                })
              }, 200)
            }
          } else {
            Transforms.removeNodes(editor, {
              at: p
            })
          }
        })
        .catch(() => {
          const p = pathRef.unref()
          if (!p) return
          Transforms.removeNodes(editor, {
            at: p
          })
        })
    }
  }, [shouldSaveImageLocally])
  if (!imageEle.url) {
    Transforms.removeNodes(editor, {
      at: ReactEditor.findPath(editor, element)
    })
    return null
  }
  return (
    <div style={{ display: 'flex' }}>
      {children}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => setMaskVisible(true)}
        onMouseLeave={() => setMaskVisible(false)}
        contentEditable={false}
        style={{
          width: '100%',
          justifyContent: imageEle.align || 'center'
        }}
        className={imageContainerClazz}
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
                fontSize: 16,
                zIndex: 10
              }}
              className={toolbarContainerClazz}
            >
              <Tooltip content="Insert caption for image">
                <Icon
                  name="park-info"
                  onClick={() => {
                    const path = ReactEditor.findPath(editor, element)
                    Transforms.insertNodes(
                      editor,
                      {
                        type: 'figcaption',
                        id: Id.getId(),
                        children: [{ text: '' }]
                      },
                      { at: Path.next(path) }
                    )
                  }}
                />
              </Tooltip>
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
          </>
        )}
        <ResizableWrapper enable={{ left: !readOnly && true, right: !readOnly && true }} minWidth={'50%'} element={element}>
          <img
            style={{
              width: '100%'
            }}
            className={css({
              objectFit: 'cover',
              borderRadius: 10,
              width: '100%'
            })}
            draggable={true}
            src={imageEle.url}
          />
        </ResizableWrapper>
      </div>
    </div>
  )
}
export default Image

const imageContainerClazz = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  position: 'relative'
})

const toolbarContainerClazz = css({
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
})
