import { Content, VirtualList } from '@/components'
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

const PdfThumbnail = () => {
  const viewer = usePdfViewer()
  const [thumbnailUrls, setThumbnailUrls] = useState<[number, string][]>([])
  const showLeftBar = useSelectAtomValue(PdfBarStateAtom, s => s.showLeftBar)
  const latestShowLeftBar = useLatest(showLeftBar)
  const throttleUpdate = useThrottleFn(
    () => {
      if (latestShowLeftBar.current) {
        const urls = Array.from(PDF_TO_THUMBNAIL.get(viewer)?.entries() || [])
        urls.sort((a, b) => a[0] - b[0])
        setThumbnailUrls(urls)
      }
    },
    { wait: 200 }
  )
  const documentId = viewer.getPdfId?.()
  const pdf = ObjectStore('pdf').useValue(documentId)
  useEffect(() => {
    if (viewer && showLeftBar) {
      throttleUpdate.run()
      viewer.onThumbnailRendered = () => {
        throttleUpdate.run()
      }
      return () => {
        delete viewer.onThumbnailRendered
      }
    }
  }, [showLeftBar])
  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    if (pdf && pdf.lastReadPage !== undefined && thumbnailUrls.length) {
      try {
        setTimeout(() => {
          virtualizerRef.current?.scrollToIndex(pdf.lastReadPage)
        })
      } catch (e) {
        console.log(e)
      }
    }
  }, [pdf?.lastReadPage, showLeftBar, thumbnailUrls])

  return (
    <Content
      flex
      column
      gap={12}
      style={{
        overflowX: 'hidden',
        height: '100%'
      }}
    >
      <VirtualList
        ref={virtualizerRef}
        items={thumbnailUrls || []}
        estimateSize={300}
        overscan={10}
        renderItem={(item, idx) => (
          <Content
            flex
            column
            alignItems={'center'}
            key={idx}
            onClick={() => {
              viewer?.jumpToPage?.(idx)
            }}
            style={{
              width: '100%'
            }}
          >
            <img
              src={item[1]}
              style={{
                cursor: 'pointer',
                boxShadow: idx === pdf?.lastReadPage ? `0 0 0 3px ${Colors.Common.SelectColor}` : Colors.Background.BoxShadow,
                width: 'min(180px, 100%)',
                borderRadius: 6,
                marginTop: 2
              }}
            />
            <div style={{ margin: '6px 0px' }}>{idx + 1}</div>
          </Content>
        )}
        style={{
          width: '100%',
          height: '100%',
          padding: '16px',
          paddingTop: 0
        }}
      />
    </Content>
  )
}

export default PdfThumbnail
