import { Content, VirtualList } from '@/components'
import Colors from '@/consts/colors'
import { usePdfViewer } from '@/core'
import { PDF_TO_THUMBNAIL } from '@/core/pdf/core/weakMaps'
import { useEffect, useState } from 'react'
import { useDebounceFn, useSelectAtomValue } from '@/hooks'
import { PdfBarStateAtom } from '../hooks/usePdfBarState'
import { useLatest } from 'react-use'
import useThrottleFn from '@/hooks/utils/useThrottleFn'

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
  useEffect(() => {
    if (viewer && showLeftBar) {
      viewer.onThumbnailRendered = () => {
        throttleUpdate.run()
      }
      return () => {
        delete viewer.onThumbnailRendered
      }
    }
  }, [showLeftBar])

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
        items={thumbnailUrls || []}
        estimateSize={300}
        renderItem={(item, idx) => (
          <div
            key={idx}
            onClick={() => {
              viewer?.jumpToPage?.(idx)
            }}
          >
            <img
              src={item[1]}
              style={{
                cursor: 'pointer',
                border: `2px solid ${Colors.Font.Primary}`,
                width: '100%'
              }}
            />
            <div style={{ margin: '4px auto 0px', textAlign: 'center' }}>{idx + 1}</div>
          </div>
        )}
        style={{ width: '100%', height: '100%', padding: '16px', paddingTop: 0 }}
      />
    </Content>
  )
}

export default PdfThumbnail
