import { Content, VirtualList } from '@/components'
import Colors from '@/consts/colors'
import { usePdfViewer } from '@/core'
import { PDF_TO_THUMBNAIL } from '@/core/pdf/core/weakMaps'
import { useUpdate } from 'react-use'
import { useMemo } from 'react'

const PdfThumbnail = () => {
  const viewer = usePdfViewer()
  const update = useUpdate()
  viewer &&
    (viewer.onThumbnailRendered = () => {
      console.log(viewer.getPdfId?.())
      update()
    })
  const thumbnailUrls = viewer ? Array.from(PDF_TO_THUMBNAIL.get(viewer)?.entries() || []) : undefined
  const sortedThumbnails = useMemo(() => {
    if (thumbnailUrls?.length) {
      thumbnailUrls.sort((a, b) => a[0] - b[0])
      return thumbnailUrls
    }
  }, [thumbnailUrls?.length])

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
        items={sortedThumbnails || []}
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
