import { Content, Icon } from '@/components'
import { GlobalGraphInstance } from '@/core'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { formatDuration, intervalToDuration } from 'date-fns'
import { atom } from 'jotai/vanilla'
import { useAtomValue } from 'jotai/react'
import { memo, useMemo } from 'react'
import { Flipped } from 'react-flip-toolkit'
import { IPdfDocument } from '~/typings/data'
import FontSize from '@/consts/font'

const PdfInfo = ({ flipId, document }: { flipId: string; document?: IPdfDocument }) => {
  const duration = intervalToDuration({ start: 0, end: (document?.totalReadTime || 1000) * 1000 })
  const { getMetaObjectByObjectId } = MetaStore
  const pdfMetaAtom = useMemo(() => {
    if (document?.id) {
      const metaObject = getMetaObjectByObjectId(document.id)
      if (metaObject) {
        return atom(get => get(metaObjectsAtom).get(metaObject?.id))
      }
    }
    return atom(null)
  }, [document?.id])
  const pdfMeta = useAtomValue(pdfMetaAtom, { store: globalStore })
  const related = useAtomValue(relatedMetaObjectsMapAtom, { store: globalStore })
  const relatedSize = pdfMeta?.id ? related.get(pdfMeta?.id)?.size : 0
  return (
    <Flipped inverseFlipId={flipId}>
      <div style={{ width: 300, padding: 7, fontFamily: 'Muli', fontSize: FontSize['13px'] }}>
        <div style={{ lineHeight: 1 }} className={ClassName.title()}>
          Document Info
        </div>
        <div className={ClassName.description()} style={{ textTransform: 'uppercase', padding: '12px 0px', fontWeight: 600 }}>
          details
        </div>
        <Content flex>
          <div style={{ flex: '0 0 100px' }}>Title:</div>
          <div>{document?.metadata?.title || 'Untitled'}</div>
        </Content>
        <Content flex>
          <div style={{ flex: '0 0 100px' }}>Author:</div>
          <div>{document?.metadata?.author || 'Unknown'}</div>
        </Content>
        {document?.createdAt && (
          <Content flex>
            <div style={{ flex: '0 0 100px' }}>Created:</div>
            <div>{DateFormat.format(document?.createdAt, DateFormat.Formats.withMinute)}</div>
          </Content>
        )}
        {document?.lastReadAt && (
          <Content flex>
            <div style={{ flex: '0 0 100px' }}>Last viewed:</div>
            <div>{DateFormat.format(document?.lastReadAt, DateFormat.Formats.withMinute)}</div>
          </Content>
        )}
        <Content flex>
          <div style={{ flex: '0 0 100px' }}>Total Read:</div>
          <div>{formatDuration(duration, { format: ['hours', 'minutes', 'seconds'] })}</div>
        </Content>
        {pdfMeta && (
          <>
            <div className={ClassName.description()} style={{ textTransform: 'uppercase', padding: '12px 0px', fontWeight: 600 }}>
              Meta object details
            </div>
            <Content flex>
              <div style={{ flex: '0 0 100px' }}>Related objects:</div>
              <div>{relatedSize}</div>
            </Content>
          </>
        )}
        <div className={ClassName.description()} style={{ textTransform: 'uppercase', padding: '12px 0px 8px', fontWeight: 600 }}>
          actions
        </div>
        <div style={{ margin: '0px -8px', fontSize: FontSize['14px'] }}>
          {pdfMeta && (
            <Content onClick={() => GlobalGraphInstance?.open(pdfMeta)} flex gap={8} className={ClassName.flatButton()}>
              <Icon name="park-share-one" />
              <span>Open Graph</span>
            </Content>
          )}
        </div>
      </div>
    </Flipped>
  )
}

export default memo(PdfInfo)
