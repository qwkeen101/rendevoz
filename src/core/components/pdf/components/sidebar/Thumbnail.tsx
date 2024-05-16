import { Content, Icon, VirtualList } from '@/components'
import Colors from '@/consts/colors'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { PdfBarStateAtom } from '../../hooks/usePDFBarState'
import { ObjectStore } from '@/api/stores'
import { Virtualizer } from '@tanstack/react-virtual'
import { Utils } from 'rendevoz'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import { useAtomValue } from 'jotai/react'

const PDFThumbnail = () => {
  const instance = usePDFInstance()
  const pages = useSelectAtomValue(PdfStateAtom, s => s.numPages) ?? 1
  const showThumbnail = useSelectAtomValue(PdfBarStateAtom, s => s.sidebarActive) === 'thumbnail'
  const documentId = instance.getPdfId?.()
  const pdf = ObjectStore('pdf').useValue(documentId)
  const [ratio, setRatio] = useState<number>()
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  const thumbnailURLMap = useAtomValue(instance.values.thumbnailAtom)
  useEffect(() => {
    if (!ratio) {
      instance.values.document?.getPage(2).then(p => {
        const v = p.getViewport({ scale: 1 })
        setRatio(v.height / v.width)
      })
    }
    if (pdf && pdf.lastReadPage !== undefined) {
      try {
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(pdf.lastReadPage)
        })
      } catch (e) {
        console.log(e)
      }
    }
  }, [showThumbnail])
  return (
    <Content
      flex
      column
      style={{
        overflow: 'hidden',
        height: '100%'
      }}
    >
      <VirtualList
        ref={virtualizerRef}
        items={Utils.range(0, pages - 1)}
        estimateSize={150}
        overscan={10}
        renderItem={(item, idx) => (
          <Content
            flex
            column
            alignItems={'center'}
            key={idx}
            onClick={() => {
              instance?.navigateOps?.jumpToPage?.(idx)
            }}
            style={{
              width: '100%'
            }}
          >
            <ThumbnailItem imgURL={thumbnailURLMap.get(idx)} ratio={ratio} lastReadPage={pdf?.lastReadPage} pageIndex={idx} />
            <div style={{ margin: '6px 0px' }} className={'transparent-font font-size-13'}>
              {idx + 1}
            </div>
          </Content>
        )}
        style={{
          width: '100%',
          height: '100%',
          padding: '12px',
          overflowAnchor: 'none'
        }}
      />
    </Content>
  )
}

const ThumbnailItem = ({
  pageIndex,
  lastReadPage,
  ratio = 1,
  imgURL
}: {
  pageIndex: number
  lastReadPage?: number
  ratio?: number
  imgURL?: string
}) => {
  const instance = usePDFInstance()
  useLayoutEffect(() => {
    instance.getThumbnail?.(pageIndex)
  }, [])
  if (imgURL) {
    return (
      <img
        src={imgURL}
        style={{
          cursor: 'pointer',
          boxShadow: pageIndex === lastReadPage ? `0 0 0 3px ${Colors.Common.SelectColor}` : '0 0 0 1px var(--border-background)',
          width: 'min(240px, 100%)',
          borderRadius: 6,
          marginTop: 2
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: 'min(240px, 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 0 1px var(--border-background)',
        borderRadius: 6,
        color: Colors.Common.SelectColor,
        marginTop: 2,
        paddingBottom: ratio ? `${ratio * 100}%` : '160%'
      }}
    >
      <Icon
        size={30}
        name={'park-loading-four'}
        style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
        spin
      />
    </div>
  )
}
export default PDFThumbnail
