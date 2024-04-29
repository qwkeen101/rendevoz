import { css } from '@emotion/css'
import { ReactEditor, RenderElementProps, useSlateStatic } from '../../slate-react'
import { ImageElement } from '~/typings'
import { useEffect, useRef, useState } from 'react'
import { Icon, Tooltip } from '@/components'
import { Path, Transforms } from 'slate'
import useReadOnlyEditor from '../../hooks/useReadOnly'
import Id from '@/utils/id'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import ResizableWrapper from '../ResizeWrapper'
import FileSystem from '@/api/fileSystem'
import { selectAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

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
      // if remote can be touched, don't save and remove
      try {
        fetch(imageEle.url).then(res => {
          if (res.ok) {
            if (shouldSaveImageLocally) {
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
            }
          } else {
            Transforms.removeNodes(editor, {
              at: ReactEditor.findPath(editor, element)
            })
          }
        })
      } catch (e) {
        Transforms.removeNodes(editor, {
          at: ReactEditor.findPath(editor, element)
        })
      }
    }
  }, [])
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
                        children: [{ text: 'Caption For Image' }]
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
