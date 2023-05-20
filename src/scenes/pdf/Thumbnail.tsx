import { Content } from '@/components'
import Colors from '@/consts/colors'
import { usePdfViewer } from '@/core'
import { PDF_TO_THUMBNAIL } from '@/core/pdf/core/weakMaps'
import { useAtomValue } from 'jotai'
import { useUpdate } from 'react-use'
import { PdfPageStateAtom } from '.'
import { Rnd } from 'react-rnd'

const PdfThumbnail = () => {
  const viewer = usePdfViewer()
  const update = useUpdate()
  viewer &&
    (viewer.onThumbnailRendered = () => {
      update()
    })
  const thumbnailUrls = viewer ? PDF_TO_THUMBNAIL.get(viewer)?.entries() : undefined
  const pageState = useAtomValue(PdfPageStateAtom)
  if (!pageState.thumbnailVisible) return null
  return (
    <Rnd
      disableDragging
      default={{
        x: 0,
        y: 0,
        width: 240,
        height: '100%'
      }}
      enableResizing={{
        right: true
      }}
      maxWidth={500}
      minWidth={100}
      style={{
        height: '100%',
        position: 'relative'
      }}
    >
      <Content
        flex
        column
        gap={12}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100%',
          padding: '16px'
        }}
      >
        {Array.from(thumbnailUrls || [])
          .sort((a, b) => a[0] - b[0])
          .map((i, idx) => (
            <div
              key={idx}
              onClick={() => {
                viewer?.jumpToPage?.(idx)
              }}
            >
              <img
                src={i[1]}
                style={{
                  cursor: 'pointer',
                  border: `2px solid ${Colors.Font.Primary}`,
                  width: '100%'
                }}
              />
              <div style={{ margin: '4px auto 0px', textAlign: 'center' }}>{idx + 1}</div>
            </div>
          ))}
      </Content>
    </Rnd>
  )
}

export default PdfThumbnail
