import { atom, useAtomValue, useSetAtom } from 'jotai'
import { IVideoInstance } from '~/typings'
import { captureVideoFrame, captureVideoFrameBlob } from '../utils'
import { saveImageLocally } from '@/utils/img'
import { ObjectStore } from '@/stores'
import { RefObject, useEffect } from 'react'
import { assignProperties, delay } from '@/utils'
import { VideoStateAtom } from './useVideoState'
import { VideoToolbarStateAtom } from './useVideoToolbarState'
import Id from '@/utils/id'
import { getSetting } from '@/core'

export const VideoInstanceAtom = atom<Partial<IVideoInstance>>({})

export const useAssignVideoInstance = (videoId: number, containerRef: RefObject<HTMLElement>) => {
  const videoInstance = useVideoInstance()
  const videoState = useAtomValue(VideoStateAtom)
  const setToolbarState = useSetAtom(VideoToolbarStateAtom)
  useEffect(() => {
    containerRef.current?.focus?.()
  }, [videoState.paused])
  assignProperties(videoInstance, {
    getVideoId: () => videoId,
    getVideoState: () => videoState,
    captureImage: async (time, size) => {
      const offscreenVideo = videoInstance.getOffscreenVideo?.()
      if (offscreenVideo) {
        return await captureVideoFrame(offscreenVideo, time, size)
      }
    },
    insertChapter: async chapter => {
      console.log(chapter)
      if (!chapter.startTime) return
      const video = await ObjectStore('video').getOneById(videoId)
      const offscreenVideo = videoInstance.getOffscreenVideo?.()
      if (video) {
        const chapters = video.chapters || []
        if (chapters.length === 0) {
          if (offscreenVideo) {
            const img = await captureVideoFrameBlob(offscreenVideo, 0)
            const imgPath = await saveImageLocally(img, { compress: false })
            chapters.push({
              startTime: 0,
              name: 'Untitled Chapter',
              id: Id.getId(),
              imageUrl: imgPath
            })
          } else {
            chapters.push({
              startTime: 0,
              name: 'Untitled Chapter',
              id: Id.getId()
            })
          }
        }
        const img = await videoInstance.captureCurrentImage?.()
        if (!img) return Promise.reject()
        const imgPath = await saveImageLocally(img, { compress: false })
        await ObjectStore('video').updateOne({
          id: videoId,
          chapters: [
            ...chapters,
            {
              ...chapter,
              startTime: chapter.startTime!,
              name: chapter.name || 'Untitled Chapter',
              id: chapter.id || Id.getId(),
              imageUrl: imgPath
            }
          ]
        })
      }
    },
    deleteChapter: async id => {
      const video = await ObjectStore('video').getOneById(videoId)
      if (video) {
        let chapters = video.chapters || []
        chapters = chapters.filter(i => i.id !== id)
        await ObjectStore('video').updateOne({ id: videoId, chapters })
      }
    },
    insertChapters: async chapters => {
      const video = await ObjectStore('video').getOneById(videoId)
      if (video) {
        const _chapters = video.chapters || []
        await ObjectStore('video').updateOne({
          id: videoId,
          chapters: [..._chapters, ...chapters]
        })
      }
    },
    updateChapter: async chapter => {
      const video = await ObjectStore('video').getOneById(videoId)
      if (video) {
        const chapters = video.chapters
        if (chapters?.length) {
          const originChapter = chapters.find(i => i.id === chapter.id)
          const newChapters = chapters.filter(i => i.id !== chapter.id)
          const newChapter = Object.assign({}, originChapter, chapter)
          await ObjectStore('video').updateOne({
            id: videoId,
            chapters: [...newChapters, newChapter]
          })
        }
      }
    },
    insertLabel: async (label, shouldJumpBack = true) => {
      if (!label.videoTime) return
      const setting = getSetting()
      const goBack = setting.video.goBackWhenMakingLabel || 0
      const time = shouldJumpBack ? Math.max(0, label.videoTime - goBack) : label.videoTime
      if (goBack > 0 && shouldJumpBack) {
        videoInstance.jumpTo?.(time)
        await delay(500)
      }
      if (!time) return Promise.reject()
      const img = await videoInstance.captureCurrentImage?.()
      if (!img) return Promise.reject()
      const imgPath = await saveImageLocally(img, { compress: false })
      console.log(time, label.videoTime)
      const one = await ObjectStore('videoLabel').addOne({
        videoTime: time,
        imageUrl: imgPath,
        parentObjectId: videoId
      })
      console.log(one)
      const video = await ObjectStore('video').getOneById(videoId)
      if (video) {
        const labels = video.labels || []
        await ObjectStore('video').updateOne({
          id: videoId,
          labels: [...labels, one.id]
        })
      }
      return one
    },
    getMarkerContainer: () => {
      return containerRef.current?.querySelector("[role='video-process-marker']")
    },
    getPlayerElement: () => containerRef.current,
    closeThumbnail: () => {
      setToolbarState(s => ({
        ...s,
        thumbnailVisible: false,
        currentHoverLabelId: undefined
      }))
    },
    openThumbnailAtTime: async (time, opts) => {
      const marker = videoInstance.getMarkerContainer?.()
      const ele = videoInstance.getOffscreenVideo?.()
      if (!marker || !videoState.totalTime || !ele) return
      const markerBounding = marker.getBoundingClientRect()
      const x = (time / videoState.totalTime) * markerBounding.width + markerBounding.left
      const chapter = videoState.sortedChapters?.findLast(i => i.startTime < time)
      const img = await captureVideoFrame(ele, time)
      setToolbarState(s => ({
        ...s,
        thumbnailVisible: true,
        thumbnailChapterName: chapter?.name,
        thumbnailPosition: {
          x,
          y: markerBounding.top
        },
        thumbnailUrl: img,
        thumbnailLabelName: opts?.labelName,
        currentHoverLabelId: opts?.labelId,
        currentHoverTime: time
      }))
    },
    deleteLabel: async id => {
      await ObjectStore('videoLabel').deleteOneById(id)
      const video = await ObjectStore('video').getOneById(videoId)
      if (video) {
        await ObjectStore('video').updateOne({
          id: videoId,
          labels: video.labels?.filter(i => i !== id)
        })
      }
    }
  })
}
export const useVideoInstance = () => useAtomValue(VideoInstanceAtom)
