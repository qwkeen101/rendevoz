import { Content, Icon, Image } from '@/components'
import { useTheme } from '@/hooks'
import useDocumentStore from '@/stores/document.store'
import { css } from '@emotion/css'
import { cloneElement, createElement, FC, useLayoutEffect, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { IPdfDocument } from '~/typings/data'
import { BookHighlightElement } from '../../types/outerElementTypes'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { Transforms } from 'slate'
import { AnimatePresence, motion } from 'framer-motion'
import { useGlobalIsDragging } from '@/components/globalDragOverlay'
import ClassName from '@/styles/classNames'
import WideCard from '../cards/WideCard'
import SlimCard from '../cards/SlimCard'
import { CardElement } from '../../types/baseTypes'
import NoteCard from '../cards/NoteCard'
import { useNavigate } from 'react-router-dom'

const BookHighlight: FC<RenderElementProps> = ({ element, children }) => {
  const [showNav, setShowNav] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const highlightElement = element as BookHighlightElement
  const cardType = (element as CardElement).cardType || 'wide'
  const editor = useSlate()
  const [document, setDocument] = useState<IPdfDocument>()
  const navigate = useNavigate()
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const { getDocumentById } = useDocumentStore()
  useLayoutEffect(() => {
    highlightElement.documentId && setDocument(getDocumentById(highlightElement.documentId))
  }, [highlightElement, getDocumentById])

  const renderMain = () => (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setShowNav(true)}
      onMouseLeave={() => setShowNav(false)}
    >
      <div className={ClassName.title(undefined, undefined, element.color)}>
        📚 {document ? document.metadata?.title || document.name : 'Unknown book'}
      </div>
      <div className={ClassName.description()}>✍🏻 {document ? document.metadata?.author || 'Unknown author' : 'Unknown author'}</div>
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
          fontSize: '0.88rem',
          overflow: 'hidden',
          background: 'inherit',
          wordBreak: 'break-word'
        })}
      ></AutosizeTextarea>
      <Content
        flex
        alignItems="center"
        gap={20}
        className={css({
          color: defaultFontColorGrey,
          fontSize: '0.8rem'
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
    </div>
  )
  const renderLineMain = () => (
    <Content flex auto alignItems="center" justifyContent="space-between" gap={20}>
      <Content flex column auto>
        <div
          onClick={() => {
            navigate(`/pdf/${document?.id}`)
          }}
          className={css([
            ClassName.animatedBorderBottom(-1, 0, 1, element.color),
            {
              fontSize: 15,
              fontWeight: 500,
              width: 'fit-content'
            }
          ])}
        >
          {document?.metadata?.title}
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
            fontSize: '0.88rem',
            overflow: 'hidden',
            background: 'inherit',
            wordBreak: 'break-word'
          })}
        ></AutosizeTextarea>
      </Content>
      <Content>
        <div className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}>
          Book highlight
        </div>
      </Content>
    </Content>
  )
  return (
    <NoteCard
      main={cardType === 'line' ? renderLineMain() : renderMain()}
      children={children}
      pictureUrl={document?.metadata?.coverUrl}
      element={element}
    />
  )
}
export default BookHighlight
