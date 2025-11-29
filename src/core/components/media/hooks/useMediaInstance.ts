import { atom, useAtom, useAtomValue } from 'jotai'
import { saveImageLocally } from '@/utils/img'
import { RefObject, useEffect } from 'react'
import { assignProperties, delay } from '@/utils'
import { MediaStateAtom } from './useMediaState'
import Id from '@/utils/id'
import { getSetting } from '@/core'
import { IMediaInstance } from '~/typings'
import { WebVTTParser } from 'webvtt-parser'
import assignAIOps from '@/core/components/media/components/AI/assignAIOps'

export const MediaInstanceAtom = atom<IMediaInstance>({})

export const useAssignMediaInstance = (containerRef: RefObject<HTMLElement>) => {
  const mediaInstance = useMediaInstance()
  const [mediaState, setMediaState] = useAtom(MediaStateAtom)
  useEffect(() => {
    containerRef.current?.focus?.()
  }, [mediaState.paused])
  assignAIOps(mediaInstance)
  assignProperties(mediaInstance, {
    focus: () => {
      containerRef.current?.focus()
    },
    getSubtitle: async () => {
      const { subtitles, subtitleLang, subtitleList } = mediaState
      if (subtitles?.length) {
        return subtitles
      }
      const targetFile =
        subtitleList?.find(i => i.lang.includes('English')) || subtitleList?.find(i => i.lang === subtitleLang) || subtitleList?.[0]
      if (targetFile) {
        if (targetFile.value) {
          return targetFile.value.map(i => ({ startTime: i.start, endTime: i.end, text: i.text }))
        }
        if (targetFile.url) {
          const text = await fetch(targetFile.url).then(i => i.text())
          try {
            const json = JSON.parse(text)
            return json
          } catch (e) {
            const parser = new WebVTTParser()
            const tree = parser.parse(text, 'metadata')
            return tree.cues
          }
        }
      }
      return Promise.reject()
    },
    setMediaState: setMediaState,
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
    getPlayerElement: () => containerRef.current,
    deleteLabel: async id => {
      await mediaInstance.on?.({ type: 'deleteLabel', labelId: id })
    }
  })
}
export const useMediaInstance = () => useAtomValue(MediaInstanceAtom)
