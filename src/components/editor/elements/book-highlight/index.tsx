import { Content, Icon } from '@/components'
import { useTheme, useToggle } from '@/hooks'
import { documentsAtom } from '@/stores/document.store'
import { css } from '@emotion/css'
import { FC, useMemo, useState } from 'react'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { BookHighlightElement } from '../../types/outerElementTypes'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
import { Transforms } from 'slate'
import { AnimatePresence, motion } from 'framer-motion'
import { useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import ClassName from '@/styles/classNames'
import { CardElement } from '../../types/baseTypes'
import NoteCard from '../cards/NoteCard'
import { useNavigate } from 'react-router-dom'
import { atom } from 'jotai/vanilla'
import { useAtomValue } from 'jotai/react'
import { globalStore } from '@/stores/stores'
import { labelsAtom } from '@/stores/label.store'
import { GlobalInstances } from '@/components/layout'
import { toast } from 'react-hot-toast'

const BookHighlight: FC<RenderElementProps> = ({ element, children }) => {
  const [showNav, setShowNav] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const [showContent, toggleShowContent] = useToggle(false)
  const highlightElement = element as BookHighlightElement
  const cardType = (element as CardElement).cardType
  const editor = useSlate()
  const labelId = highlightElement.originId
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey')
  const documentId = highlightElement.documentId
  const navigate = useNavigate()
  const documentAtom = useMemo(
    () => (documentId ? atom(get => get(documentsAtom).get(documentId)) : atom(null)),
    [highlightElement.documentId]
  )

  const document = useAtomValue(documentAtom, { store: globalStore })
  const labelAtom = useMemo(() => atom(get => get(labelsAtom).get(labelId)), [labelId])
  const label = useAtomValue(labelAtom, { store: globalStore })
  const page = label?.page

  const handleJumpToTarget = () => {
    if (!label) {
      toast.error("Target label doesn't exist!")
      return
    }

    if (page === undefined) {
      navigate(`/pdf/${documentId}`)
      toast.error('Page not found!')
      return
    }
    console.log(GlobalInstances.pdfInstances, documentId)
    if (GlobalInstances.pdfInstances.filter(i => i.pdfId === documentId).length === 0) {
      navigate(`/pdf/${documentId}`)
    }
    const goToPage = () => {
      if (GlobalInstances.pdfInstances.filter(i => i.pdfId === documentId).length > 0) {
        GlobalInstances.pdfInstances
          .filter(i => i.pdfId === documentId)
          .forEach(i => {
            console.log(i.pdfId)
            if (i.viewerRef.current) {
              i.viewerRef.current.jumpToPage(page)
            } else {
              requestIdleCallback(goToPage)
            }
          })
      } else {
        requestIdleCallback(goToPage)
      }
    }
    goToPage()
  }

  const renderMain = () => (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setShowNav(true)}
      onMouseLeave={() => setShowNav(false)}
    >
      <div className={ClassName.title()}>
        <div style={{ marginLeft: -16 }} className={ClassName.flexLayout('center', 'flex-start')}>
          <Icon
            style={{
              opacity: showNav ? 1 : 0,
              transform: showContent ? 'rotate(90deg)' : undefined,
              transition: 'all 0.3s ease'
            }}
            size={14}
            name="park-right-one"
            theme='filled'
            onClick={toggleShowContent}
          />
          📚 <span>{document ? document.name : 'Unknown book'}</span>
        </div>
      </div>
      <div className={ClassName.description()}>✍🏻 {document ? document.metadata?.author || 'Unknown author' : 'Unknown author'}</div>
      {showContent ? (
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
      ) : (
        <div className={ClassName.ellipsisFont(2)}>{highlightElement.selectedText}</div>
      )}
      {page !== undefined && (
        <Content
          flex
          alignItems="center"
          gap={20}
          className={css({
            color: defaultFontColorGrey,
            fontSize: '0.8rem'
          })}
        >
          <span>Page: {page + 1}</span>
          <span>
            <AnimatePresence>
              {showNav && !globalDragging && (
                <motion.div
                  initial={{ opacity: 0, x: -20, background: 'rgba(0,0,0,0)', padding: '0px 4px', borderRadius: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  whileHover={{ background: 'rgba(0,0,0,0.07)' }}
                >
                  <Content flex centered gap={5} style={{ cursor: 'pointer' }} onClick={handleJumpToTarget}>
                    <span>Go to target</span>
                    <Icon style={{ marginTop: 2 }} name="park-arrow-right" />
                  </Content>
                </motion.div>
              )}
            </AnimatePresence>
          </span>
        </Content>
      )}
    </div>
  )
  const renderLineMain = () => (
    <Content
      style={{ padding: '4px 8px' }}
      onMouseEnter={() => setShowNav(true)}
      onMouseLeave={() => setShowNav(false)}
      flex
      auto
      alignItems="center"
      justifyContent="space-between"
      gap={20}
    >
      <Content flex column auto>
        <div style={{ marginLeft: -16 }} className={ClassName.flexLayout('center', 'flex-start')}>
          <Icon
            style={{
              opacity: showNav ? 1 : 0,
              transform: showContent ? 'rotate(90deg)' : undefined,
              transition: 'all 0.3s ease'
            }}
            size={14}
            name="park-right-one"
            theme='filled'
            onClick={toggleShowContent}
          />
          <span
            onClick={handleJumpToTarget}
            className={css([ClassName.animatedBorderBottom(undefined, undefined, 1), ClassName.title('15px')])}
          >
            {document ? document.name : 'Unknown book'}
          </span>
        </div>
        {showContent ? (
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
        ) : (
          <div className={ClassName.ellipsisFont(2)}>{highlightElement.selectedText}</div>
        )}
      </Content>
      <div
        style={{ flexShrink: 0 }}
        className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}
      >
        Book highlight
      </div>
    </Content>
  )
  return (
    <NoteCard
      main={cardType === 'line' || !cardType ? renderLineMain() : renderMain()}
      children={children}
      pictureUrl={document?.metadata?.coverUrl}
      element={element}
    />
  )
}
export default BookHighlight
