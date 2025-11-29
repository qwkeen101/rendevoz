import { memo, useRef } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import Video from '@/core/components/media/wrappers/Video'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { IMediaInstance } from '~/typings'
import { IconWithPopover } from '@/components'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import useYoutubeVideoToMeta from '@/core/components/youtube/hooks/useYoutubeVideoToMeta'
import { StarAndSaveToFolder } from '@/core/components'
import CommonAddToLibrary from '@/core/components/common/CommonAddToLibrary'

export default memo(() => {
  const { id } = useParams()
  const location = useLocation()
  const folderId = location.state?.folderId
  const videoId = id ? Number(id) : undefined
  const video = ObjectStore('youtubeVideo').useValue(videoId)
  const instance = useYoutubeInstance()
  const instanceRef = useRef<IMediaInstance>()
  instance.getCurrentVideoInstance = () => {
    return instanceRef.current
  }
  if (!video) return null
  return (
    <div className={'w-full h-full overflow-hidden'}>
      <Video
        onInstanceInitialized={i => {
          instanceRef.current = i
        }}
        mediaState={{
          url: `https://www.youtube.com/embed/${video.videoId}`,
          name: video.name,
          description: video.description,
          thumbnail: video.thumbnail,
          websiteUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          layout: {
            headerRight: (
              <>
                <FollowIcon />
                <AddIcon />
              </>
            )
          },
          state: {
            ytFolderId: folderId,
            followed: video.followed,
            ytVideoId: video.id,
            ytPlaylistId: video.playlistAppId,
            ytChannelId: video.channelAppId
          }
        }}
      />
    </div>
  )
})

const FollowIcon = () => {
  const { id } = useParams()
  const videoId = Number(id)
  const item = ObjectStore('youtubeVideo').useValue(videoId)
  const { t } = useTranslation()
  const instance = useYoutubeInstance()
  return (
    <IconWithPopover
      className={classnames('hover-active-button', item?.followed && 'text-red-500')}
      onClick={() => {
        if (!item?.followed) {
          instance.follow?.(videoId, 'video', false)
        }
      }}
      withClickCover
      placement={['bottom']}
      content={setVisible => (
        <StarAndSaveToFolder
          initialFolderId={() =>
            ObjectStore('youtubeFolder')
              .getCachedAll()
              .find(i => i.items?.find(o => o.id === videoId))?.id
          }
          currentName={item?.name || ''}
          type={'youtubeFolder'}
          onSave={(name, id) => {
            setVisible(false)
            if (item) {
              if (name !== item.name) {
                ObjectStore('youtubeVideo').updateOne({ id: videoId, name })
              }
              const allFolders = ObjectStore('youtubeFolder').getCachedAll()
              allFolders.forEach(f => {
                if (f.id !== id) {
                  if (f.items?.some(o => o.id === videoId)) {
                    ObjectStore('youtubeFolder').updateOne({ id: f.id, items: f.items?.filter(o => o.id !== videoId) })
                  }
                }
              })
              if (id) {
                const currentFolder = ObjectStore('youtubeFolder').getCachedOneById(id)
                if (currentFolder) {
                  if (!currentFolder.items?.some(o => o.id === videoId)) {
                    ObjectStore('youtubeFolder').updateOne({ id, items: [{ type: 'video', id: videoId }, ...(currentFolder.items || [])] })
                  }
                }
              }
            }
          }}
          onRemove={() => {
            setVisible(false)
            instance.follow?.(videoId, 'video', false)
            ObjectStore('youtubeFolder')
              .getCachedAll()
              .forEach(i => {
                if (i.items?.some(o => o.id === videoId)) {
                  ObjectStore('youtubeFolder').updateOne({ id: i.id, items: i.items?.filter(o => o.id !== videoId) })
                }
              })
          }}
        />
      )}
      tooltip={item?.followed ? undefined : t(trans.Follow)}
      name={Icons.Follow}
      theme={item?.followed ? 'filled' : undefined}
      size={20}
    ></IconWithPopover>
  )
}
const AddIcon = () => {
  const { id } = useParams()
  const videoId = Number(id)
  const instance = useYoutubeInstance()
  const meta = useYoutubeVideoToMeta(!Number.isNaN(videoId) ? videoId : undefined)
  return (
    <CommonAddToLibrary
      onAdd={() => {
        instance.addVideoAsMeta?.(videoId)
      }}
      metaId={meta?.id}
    />
  )
}
