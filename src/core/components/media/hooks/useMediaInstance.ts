import { atom, useAtomValue, useSetAtom } from 'jotai'
import { saveImageLocally } from '@/utils/img'
import { ObjectStore } from '@/api/stores'
import { RefObject, useEffect } from 'react'
import { assignProperties, delay } from '@/utils'
import { MediaStateAtom } from './useMediaState'
import { MediaToolbarStateAtom } from './useMediaToolbarState'
import Id from '@/utils/id'
import { getSetting } from '@/core'
import { IMediaInstance, IMediaLabel } from '~/typings'

export const MediaInstanceAtom = atom<IMediaInstance>({})

export const useAssignMediaInstance = (containerRef: RefObject<HTMLElement>) => {
  const mediaInstance = useMediaInstance()
  const mediaState = useAtomValue(MediaStateAtom)
  const setToolbarState = useSetAtom(MediaToolbarStateAtom)
  useEffect(() => {
    containerRef.current?.focus?.()
  }, [mediaState.paused])
  assignProperties(mediaInstance, {
    focus: () => {
      containerRef.current?.focus()
    },
    getVideoState: () => mediaState,
    insertChapter: async chapter => {
      if (!chapter.startTime) return
      await mediaInstance.on?.({ type: 'addChapter', currentChapter: [{ ...chapter, id: chapter.id || Id.getId() }] })
    },
    deleteChapter: async id => {
      await mediaInstance.on?.({ type: 'deleteChapter', id })
    },
    insertChapters: async chapters => {
      await mediaInstance.on?.({ type: 'addChapter', currentChapter: chapters.map(i => ({ ...i, id: i.id || Id.getId() })) })
    },
    updateChapter: async chapter => {
      await mediaInstance.on?.({ type: 'updateChapter', currentChapter: chapter })
    },
    insertLabel: async (label, opts) => {
      if (label.time === undefined) return
      const setting = getSetting()
      const shouldJumpBack = opts?.shouldJumpBack ?? true
      const goBack = setting.video.goBackWhenMakingLabel || 0
      const time = shouldJumpBack ? Math.max(0, label.time - goBack) : label.time
      if (goBack > 0 && shouldJumpBack) {
        mediaInstance.actionOps?.jumpTo(time)
        await delay(500)
      }
      if (time === undefined) return Promise.reject()
      let imgPath: string | undefined = undefined
      if (!opts?.skipCaptureImage) {
        const img = await mediaInstance.imageOps?.captureCurrentImage()
        if (img) {
          imgPath = await saveImageLocally(img)
        }
      }
      mediaInstance.openLabelEditor?.(
        {
          time,
          selectedText: label.name,
          imageUrl: imgPath
        },
        opts?.popoverPosition
      )
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
