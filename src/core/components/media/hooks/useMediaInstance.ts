import { atom, useAtomValue, useSetAtom } from 'jotai'
import { IMediaInstance, IMediaLabel } from '~/typings'
import { captureVideoFrame, captureVideoFrameBlob } from '../utils'
import { saveImageLocally } from '@/utils/img'
import { ObjectStore } from '@/api/stores'
import { RefObject, useEffect } from 'react'
import { assignProperties, delay } from '@/utils'
import { MediaStateAtom } from './useMediaState'
import { MediaToolbarStateAtom } from './useMediaToolbarState'
import Id from '@/utils/id'
import { getSetting } from '@/core'

export const MediaInstanceAtom = atom<IMediaInstance>({})

export const useAssignMediaInstance = (containerRef: RefObject<HTMLElement>) => {
  const mediaInstance = useMediaInstance()
  const mediaState = useAtomValue(MediaStateAtom)
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  useEffect(() => {
    containerRef.current?.focus?.()
  }, [mediaState.paused])
  assignProperties(mediaInstance, {
    getVideoState: () => mediaState,
    insertChapter: async chapter => {
      if (!chapter.startTime) return
      await mediaInstance.on?.({ type: 'addChapter', currentChapter: [chapter] })
    },
    deleteChapter: async id => {
      await mediaInstance.on?.({ type: 'deleteChapter', id })
    },
    insertChapters: async chapters => {
      await mediaInstance.on?.({ type: 'addChapter', currentChapter: chapters })
    },
    updateChapter: async chapter => {
      await mediaInstance.on?.({ type: 'updateChapter', currentChapter: chapter })
    },
    insertLabel: async (label, shouldJumpBack = true, skipCaptureImage = false) => {
      if (!label.time) return
      const setting = getSetting()
      const goBack = setting.video.goBackWhenMakingLabel || 0
      const time = shouldJumpBack ? Math.max(0, label.time - goBack) : label.time
      if (goBack > 0 && shouldJumpBack) {
        mediaInstance.actionOps?.jumpTo(time)
        await delay(500)
      }
      if (!time) return Promise.reject()
      let imgPath: string | undefined = undefined
      if (!skipCaptureImage) {
        const img = await mediaInstance.imageOps?.captureCurrentImage()
        if (img) {
          imgPath = await saveImageLocally(img)
        }
      }
      const one = (await mediaInstance.on?.({
        type: 'addLabel',
        currentLabel: {
          time,
          selectedText: label.name,
          imageUrl: imgPath
        }
      })) as IMediaLabel
      mediaInstance.actionOps
        ?.clip?.({
          start: Math.max(0, time - 5),
          end: time + 5
        })
        .then(p => {
          ObjectStore(one.specType).updateOne({ id: one.id, clipUrl: p })
        })
      if (setting.media.openPopoverWhenHighlight) {
        mediaInstance.openLabelPopover?.(one.id)
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
    deleteLabel: async id => {
      await mediaInstance.on?.({ type: 'deleteLabel', labelId: id })
    }
  })
}
export const useMediaInstance = () => useAtomValue(MediaInstanceAtom)
