import { Content, Icon, VirtualList } from '@/components'
import Colors from '@/consts/colors'
import { usePdfViewer } from '@/core'
import { PDF_TO_THUMBNAIL } from '@/core/components/pdf/core/weakMaps'
import { useEffect, useRef, useState } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { PdfBarStateAtom } from '../hooks/usePdfBarState'
import { useLatest } from 'react-use'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import usePdfState from '@/core/components/pdf/hooks/usePdfState'
import { ObjectStore } from '@/api/stores'
import { Virtualizer } from '@tanstack/react-virtual'
import { Utils } from 'rendevoz'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'

const PdfThumbnail = () => {
  const viewer = usePdfViewer()
  const showLeftBar = useSelectAtomValue(PdfBarStateAtom, s => s.showLeftBar)
  const documentId = viewer.getPdfId?.()
  const pdf = ObjectStore('pdf').useValue(documentId)
  const [pages, setPages] = useState(1)

  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    if (pdf && showLeftBar && pdf.lastReadPage !== undefined) {
      try {
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(pdf.lastReadPage)
        })
      } catch (e) {
        console.log(e)
      }
    }
  }, [showLeftBar])
  useEffect(() => {
    viewer.getDocument?.().then(i => {
      const p = i.numPages
      console.log(p)
      setPages(p)
    })
  }, [showLeftBar])
  return (
    <Content
      flex
      column
      gap={12}
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
              viewer?.navigateOps?.jumpToPage?.(idx)
            }}
            style={{
              width: '100%'
            }}
          >
            <ThumbnailItem lastReadPage={pdf?.lastReadPage} pageIndex={idx} />
            <div style={{ margin: '6px 0px' }} className={'transparent-font font-size-13'}>
              {idx + 1}
            </div>
          </Content>
        )}
        style={{
          width: '100%',
          height: '100%',
          padding: '16px',
          paddingTop: 0,
          overflowAnchor: 'none'
        }}
      />
    </Content>
  )
}

const ThumbnailItem = ({ pageIndex, lastReadPage }: { pageIndex: number; lastReadPage?: number }) => {
  const [imgUrl, setImgUrl] = useState<string>()
  const instance = usePdfInstance()
  useEffect(() => {
    const url: {
      current: string | undefined
    } = {
      current: undefined
    }
    instance.getThumbnail?.(pageIndex).then(s => {
      url.current = s
      setImgUrl(s)
    })
    return () => {
      if (url.current) {
        URL.revokeObjectURL(url.current)
      }
    }
  }, [])
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        style={{
          cursor: 'pointer',
          boxShadow: pageIndex === lastReadPage ? `0 0 0 3px ${Colors.Common.SelectColor}` : 'var(--border-box-shadow)',
          width: 'min(180px, 100%)',
          borderRadius: 6,
          marginTop: 2
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: 'min(180px, 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: Colors.Background.BoxShadow,
        borderRadius: 6,
        color: Colors.Common.SelectColor,
        fontSize: 20,
        marginTop: 2,
        height: 200
      }}
    >
      <Icon name={'park-loading-four'} spin />
    </div>
  )
}
export default PdfThumbnail
