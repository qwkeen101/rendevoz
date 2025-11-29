import { IMediaInstance } from '~/typings'
import { assignProperties } from '@/utils'
import toast from 'react-hot-toast'
import summarizeMedia from '@/core/components/media/components/AI/summarizeMedia'
import { useTranslation } from 'react-i18next'
import mindmapMedia from '@/core/components/media/components/AI/mindmapMedia'
import { useGetMediaState, useSetMediaState } from '@/core/components/media/hooks/useMediaState'
import { useRef } from 'react'
import { AIService } from '@/api/services'
import generateExamByAI from '@/core/components/exam/generateExamByAI'

export default (instance: IMediaInstance) => {
  const get = useGetMediaState()
  const setState = useSetMediaState()
  const controllerRef = useRef<AbortController>()
  const getSubtitle = async () => {
    const res = await instance.getSubtitle?.()
    if (!res || !res.length) {
      toast.error('No subtitle to summarize!')
      return
    }
    return res
  }
  const { t } = useTranslation()
  assignProperties(instance, {
    aiOps: {
      scrollToQuestion: id => {
        setState(s => ({ ...s, sidebarActive: 'exam', sidebarVisible: true, currentFocusQuestionId: id }))
        setTimeout(
          () => setState(s => ({ ...s, currentFocusQuestionId: s.currentFocusQuestionId === id ? undefined : s.currentFocusQuestionId })),
          1500
        )
      },
      getInitialMessages: async () => {
        try {
          const text = await instance.getSubtitle?.()
          return text
            ? [
                {
                  role: 'system',
                  content:
                    "Based on the content of the following media transcription, the transcription is formatted as timestamp: text, provide professional, accurate, and well-structured responses to the user's questions. Ensure that your answers are clear, concise, and supported by the information and timestamp in the transcription. The transcription is as follows: " +
                    text.map(i => `${DateFormat.formatDuration(i.startTime)}: ${i.text}`).join(' ')
                }
              ]
            : []
        } catch (e) {
          return []
        }
      },
      getActiveChatId: ignoreVisible => {
        const state = get()
        if (ignoreVisible || (state.sidebarVisible && state.sidebarActive === 'ai')) {
          return state.aiChat?.currentChat
        }
      },
      scrollToMessage: id => {
        setState(s => ({ ...s, currentFocusChatMessageId: id, sidebarActive: 'ai', sidebarVisible: true }))
        setTimeout(() => setState(s => ({ ...s, currentFocusChatMessageId: undefined })), 500)
      },
      exam: async () => {
        const subtitle = await getSubtitle()
        if (subtitle) {
          setState(s => ({ ...s, isSummarizing: true }))
          try {
            const res = await generateExamByAI(subtitle.map(i => i.text).join(' '))
            instance.on({
              type: 'update',
              updater: c => ({ ...c, exam: res.id })
            })
            setState(s => ({ ...s, isSummarizing: false, sidebarVisible: true, sidebarActive: 'exam' }))
            return
          } catch (e) {
            if (typeof e === 'string') {
              toast.error(t(e))
            }
            setState(s => ({ ...s, isSummarizing: false }))
          }
        }
        return Promise.reject()
      },
      summarize: async () => {
        const controller = new AbortController()
        if (controllerRef.current) {
          controllerRef.current.abort()
        }
        controllerRef.current = controller
        const subtitle = await getSubtitle()
        if (subtitle) {
          setState(s => ({ ...s, isSummarizing: true }))
          try {
            const res = await summarizeMedia(
              subtitle.map(i => ({ time: i.start, text: i.text })),
              AIService.getAIOutputLanguage(),
              controller.signal
            )
            controllerRef.current = undefined
            setState(s => ({ ...s, isSummarizing: false, sidebarVisible: true, sidebarActive: 'summary' }))
            const currentSummary = get().aiSummary
            instance.on?.({ type: 'aiSummarize', summary: { ...currentSummary, ...res } })
            return res
          } catch (e) {
            if (typeof e === 'string') {
              toast.error(t(e))
            }
            setState(s => ({ ...s, isSummarizing: false }))
          } finally {
            controllerRef.current = undefined
          }
        }
        return Promise.reject()
      },
      mindmap: async () => {
        const currentSummary = get().aiSummary
        const subtitle = await getSubtitle()
        if (subtitle) {
          try {
            const res = await mindmapMedia(
              subtitle.map(i => ({ text: i.text })),
              AIService.getAIOutputLanguage()
            )
            instance.on?.({ type: 'aiSummarize', summary: { ...currentSummary, mindmap: res } })
          } catch (e) {
            if (typeof e === 'string') {
              toast.error(t(e))
            }
            console.error(e)
            return Promise.reject(e)
          }
        }
        return Promise.reject()
      }
    }
  })
}
