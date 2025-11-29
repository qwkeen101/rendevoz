import MediaCore from '@/core/components/media/MediaCore'
import { memo } from 'react'

export default memo(({ mode }: { mode: 'theater' | 'cinema' | 'reader' }) => {
  return (
    <MediaCore
      style={
        mode === 'reader'
          ? {
              height: 'auto',
              width: '100%',
              gridColumn: 1,
              borderRadius: 12
            }
          : mode === 'theater'
            ? {
                height: '80%',
                width: 'auto',
                pointerEvents: 'none',
                borderRadius: 12
              }
            : {
                width: '100%',
                height: '100%',
                maxHeight: 'unset',
                aspectRatio: 'unset',
                borderRadius: 0
              }
      }
    />
  )
})
