import { Content, Icon, Image } from '@/components'
import { useTheme } from '@/hooks'
import useDocumentStore from '@/stores/document.store'
import { css } from '@emotion/css'
import { FC, useLayoutEffect, useRef, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { IPdfDocument } from '~/typings/data'
import { BookHighlightElement } from '../../types/outerElementTypes'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { Transforms } from 'slate'
import { AnimatePresence, motion } from 'framer-motion'
import { useGlobalIsDragging } from '@/components/globalDragOverlay'
import { useMeasure } from 'react-use'

const BookHighlight: FC<RenderElementProps> = ({ element, children }) => {
  const [showNav, setShowNav] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const highlightElement = element as BookHighlightElement
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const editor = useSlate()
  const [document, setDocument] = useState<IPdfDocument>()
  const [ref, { height }] = useMeasure()
  const [containerRef, { width }] = useMeasure()
  const { defaultFontColorBlack, defaultFontColorGrey, defaultBorderColorCream } = useTheme(
    'defaultFontColorBlack',
    'defaultFontColorGrey',
    'defaultBorderColorCream'
  )
  const { getDocumentById } = useDocumentStore()
  useLayoutEffect(() => {
    highlightElement.documentId && setDocument(getDocumentById(highlightElement.documentId))
  }, [highlightElement])
  useLayoutEffect(() => {
    const imageContainer = imageContainerRef.current
    if (imageContainer) {
      imageContainer.style.height = `${height + 16}px`
    }
  }, [height])
  useLayoutEffect(() => {
    const imageContainer = imageContainerRef.current
    if (imageContainer) {
      if (width < 400) {
        imageContainer.style.display = 'none'
      } else {
        imageContainer.style.display = 'block'
      }
    }
  }, [width])
  return (
    <Content
      ref={containerRef}
      contentEditable={false}
      onMouseEnter={() => setShowNav(true)}
      onMouseLeave={() => setShowNav(false)}
      flex
      className={css({
        border: `1px solid ${defaultBorderColorCream}`,
        borderRadius: 8,
        overflow: 'hidden'
      })}
    >
      <Content
        ref={ref}
        flex
        column
        className={css({
          padding: '8px 16px',
          flex: 1,
          height: 'fit-content'
        })}
      >
        <div
          className={css({
            fontSize: '1.2rem',
            fontWeight: 600,
            color: defaultFontColorBlack
          })}
        >
          📚 {document ? document.metadata?.title || document.name : 'Unknown book'}
        </div>
        <div
          className={css({
            color: defaultFontColorGrey,
            fontSize: '0.8rem'
          })}
        >
          ✍🏻 {document ? document.metadata?.author || 'Unknown author' : 'Unknown author'}
        </div>
        <AutosizeTextarea
          defaultValue={highlightElement.selectedText}
          onChange={e => {
            const value = e.target.value
            Transforms.setNodes(editor, { selectedText: value }, { at: ReactEditor.findPath(editor, highlightElement) })
          }}
          className={css({
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '1rem',
            overflow: 'hidden'
          })}
        ></AutosizeTextarea>
        <Content
          flex
          alignItems="center"
          gap={20}
          className={css({
            color: defaultFontColorGrey,
            fontSize: 13
          })}
        >
          <span>Page: {highlightElement.page}</span>
          <span>
            <AnimatePresence>
              {showNav && !globalDragging && (
                <motion.div
                  initial={{ opacity: 0, x: -20, background: 'rgba(0,0,0,0)', padding: '0px 4px', borderRadius: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ background: 'rgba(0,0,0,0.07)' }}
                >
                  <Content flex centered gap={5} style={{ cursor: 'pointer' }}>
                    <span>Go to target</span>
                    <Icon style={{ marginTop: 2 }} name="park-arrow-right" />
                  </Content>
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        </Content>
      </Content>

      <Content ref={imageContainerRef}>
        <Image
          ratio={1.33}
          className={css({
            minWidth: `140px !important`,
            height: '100%',
            '> div': {
              height: '100%'
            }
          })}
          src={document?.metadata?.coverUrl}
        />
      </Content>

      {children}
    </Content>
  )
}
export default BookHighlight
