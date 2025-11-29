import { IVideoLabel } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useIsIn } from '@/hooks'
import { CSSProperties, useState } from 'react'
import Video from '@/core/components/media/wrappers/Video'
import { Icon } from '@/components'

export default ({ label, cover, style }: { label: IVideoLabel; cover?: string; style?: CSSProperties }) => {
  const parentVideo = ObjectStore('video').useValue(label.parentObjectId)
  const image = cover
  const { ref, isIn } = useIsIn()
  const [played, setPlayed] = useState(false)
  if (!image) return null
  return (
    <div ref={ref} className={'aspect-video w-full relative'}>
      {parentVideo && image && !played && (
        <Icon
          onClick={() => setPlayed(true)}
          theme={'filled'}
          style={{
            background: 'rgb(from black r g b / var(--tw-bg-opacity))',
            padding: '12px',
            color: 'white',
            opacity: isIn ? 1 : 0,
            transition: 'all 0.2s ease'
          }}
          size={34}
          name={'park-play-one'}
          className={
            '!absolute cursor-pointer hover:bg-opacity-70 bg-opacity-40 z-10 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
          }
        />
      )}
      {played && parentVideo ? (
        <Video
          onlyCore
          mediaState={{
            autoPlay: true,
            url: parentVideo.url,
            currentTime: label.time,
            styles: {
              videoBorderRadius: 0
            }
          }}
        />
      ) : (
        <img src={image} style={style} className={'w-full aspect-video object-cover'} />
      )}
    </div>
  )
}
