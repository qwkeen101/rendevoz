import { Content } from '@/components/base'
import { documentsAtom } from '@/stores/document.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { useMemo } from 'react'
import { RenderElementProps } from 'slate-react'
import { PdfElement } from '../../../../../typings/editor/types/commonElementTypes'
import NoteCard from '../cards/NoteCard'
import Actions from '@/core/Actions'

const PdfMedia = ({ element, children }: Omit<RenderElementProps, 'attributes'>) => {
  const ele = element as PdfElement

  const documentAtom = useMemo(() => atom(get => get(documentsAtom).get(ele.pdfId)), [ele.pdfId])
  const document = useAtomValue(documentAtom, { store: globalStore })

  const renderMain = () => (
    <Content flex column gap={5}>
      <div
        onClick={() => document?.id && Actions.openPdf(document?.id)}
        className={css([
          ClassName.title(),
          ClassName.animatedBorderBottom(-2, 0, 1, 'rgba(0,0,0,0.4)'),
          { width: 'fit-content', cursor: 'pointer' }
        ])}
      >
        {document?.metadata?.title || document?.name}
      </div>
      <div className={ClassName.description()}>{document?.description}</div>
      <div className={ClassName.description()}>Author: {document?.metadata?.author || 'Unknown author'}</div>
      <div className={ClassName.description()}>
        Last read at: {(document?.lastReadAt && DateFormat.format(document.lastReadAt, DateFormat.Formats.default)) || 'Never read'}
      </div>
      <div className={ClassName.description()}>Read progress: {((document?.readProgress || 0) * 100).toFixed(1)}%</div>
      <div className={ClassName.description()}>Total notes: {document?.noteIds?.length || 0}</div>
    </Content>
  )

  const renderLineMain = () => (
    <Content flex auto alignItems="center" justifyContent="space-between" gap={20}>
      <Content
        onClick={() => document?.id && Actions.openPdf(document?.id)}
        className={css([
          ClassName.animatedBorderBottom(-1, 0, 1, element.color),
          {
            fontSize: 15,
            fontWeight: 500
          }
        ])}
      >
        {document?.metadata?.title || document?.name}
      </Content>
      <Content>
        <div className={ClassName.tag(element.background ? ClassName.TagBackgrounds.transparent : ClassName.TagBackgrounds.grey)}>Book</div>
      </Content>
    </Content>
  )
  return (
    <NoteCard
      main={ele.cardType === 'line' ? renderLineMain() : renderMain()}
      children={children}
      type="pdf"
      pictureUrl={document?.metadata?.coverUrl}
      element={element}
    />
  )
}

export default PdfMedia
