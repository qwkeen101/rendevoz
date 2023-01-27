import { Content, Icon } from '@/components'
import { GlobalGraphInstance } from '@/components/graph/GlobalGraph'
import usePdfInfo from '@/components/pdf/hooks/usePdfInfo'
import useMetaStore, { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import ClassName from '@/styles/classNames'
import DateFormat from '@/utils/dateFormat'
import { formatDuration, intervalToDuration } from 'date-fns'
import { atom } from 'jotai/vanilla'
import { useAtomValue } from 'jotai/react'
import { useMemo } from 'react'
import { Flipped } from 'react-flip-toolkit'

const PdfInfo = ({ flipId }: { flipId: string }) => {
  const [pdfInfo] = usePdfInfo()
  const duration = intervalToDuration({ start: 0, end: (pdfInfo?.totalReadTime || 1000) * 1000 })
  const { getMetaObjectByObjectId } = useMetaStore()
  const pdfMetaAtom = useMemo(() => {
    if (pdfInfo?.id) {
      const metaObject = getMetaObjectByObjectId(pdfInfo.id)
      if (metaObject) {
        return atom(get => get(metaObjectsAtom).get(metaObject?.id))
      }
    }
    return atom(null)
  }, [pdfInfo?.id])
  const pdfMeta = useAtomValue(pdfMetaAtom, { store: globalStore })
  const related = useAtomValue(relatedMetaObjectsMapAtom, { store: globalStore })
  pdfMeta?.id && related.get(pdfMeta?.id)?.delete(pdfMeta?.id)
  const relatedSize = pdfMeta?.id ? related.get(pdfMeta?.id)?.size : 0
  return (
    <Flipped inverseFlipId={flipId}>
      <div style={{ width: 300, padding: 7, fontFamily: 'Muli', fontSize: 13 }}>
        <div style={{ lineHeight: 1 }} className={ClassName.title()}>
          Document Info
        </div>
        <div className={ClassName.description()} style={{ textTransform: 'uppercase', padding: '12px 0px', fontWeight: 600 }}>
          details
        </div>
        <Content flex>
          <div style={{ flex: '0 0 100px' }}>Title:</div>
          <div>{pdfInfo?.metadata?.title || 'Untitled'}</div>
        </Content>
        <Content flex>
          <div style={{ flex: '0 0 100px' }}>Author:</div>
          <div>{pdfInfo?.metadata?.author || 'Unknown'}</div>
        </Content>
        {pdfInfo?.createdAt && (
          <Content flex>
            <div style={{ flex: '0 0 100px' }}>Created:</div>
            <div>{DateFormat.format(pdfInfo?.createdAt, DateFormat.Formats.withMinute)}</div>
          </Content>
        )}
        {pdfInfo?.lastReadAt && (
          <Content flex>
            <div style={{ flex: '0 0 100px' }}>Last viewed:</div>
            <div>{DateFormat.format(pdfInfo?.lastReadAt, DateFormat.Formats.withMinute)}</div>
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
        <div style={{ margin: '0px -8px', fontSize: 14 }}>
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

export default PdfInfo
