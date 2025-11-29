import { IPDFInstance } from '~/typings'
import { assignProperties } from '@/utils'
import summarizePDF from '@/core/components/pdf/components/sidebar/AI/summarizePDF'
import { MetaStore } from '@/api/stores'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import mindmapPDF from '@/core/components/pdf/components/sidebar/AI/mindmapPDF'
import trans from '@/consts/trans'
import { useRef } from 'react'
import { AIService } from '@/api/services'
import generateExamByAI from '@/core/components/exam/generateExamByAI'

export default (instance: IPDFInstance) => {
  const { t } = useTranslation()
  const [state, setState] = usePDFState()
  const controllerRef = useRef<AbortController>()
  const getText = () => {
    const text = instance.values.texts
      .map(i => i.str)
      .join(' ')
      .trim()
    return text
  }
  assignProperties(instance, {
    aiOps: {
      scrollToMessage: id => {
        setState(s => ({ ...s, sidebarActive: 'ai', sidebarVisible: true, currentFocusMessageId: id }))
        setTimeout(() => setState(s => ({ ...s, currentFocusMessageId: undefined })), 500)
      },
      scrollToQuestion: id => {
        setState(s => ({ ...s, sidebarActive: 'exam', sidebarVisible: true, currentFocusQuestionId: id }))
        setTimeout(
          () => setState(s => ({ ...s, currentFocusQuestionId: s.currentFocusQuestionId === id ? undefined : s.currentFocusQuestionId })),
          1500
        )
      },
      getActiveChatId: (ignoreVisible?: boolean) => {
        const chatActive = state.sidebarVisible && state.sidebarActive === 'ai'
        if (chatActive || ignoreVisible) {
          return state.state?.aiChat?.currentChat
        }
      },
      getInitialMessages: async () => {
        const text = getText()
        return text
          ? [
              {
                role: 'system',
                content:
                  "Based on the content of the following PDF document, provide professional, accurate, and well-structured responses to the user's questions. Ensure that your answers are clear, concise, and supported by the information in the document. The content of the PDF is as follows: " +
                  text
              }
            ]
          : []
      },
      exam: async () => {
        const text = getText()
        if (text) {
          setState(s => ({ ...s, isSummarizing: true }))
          try {
            const res = await generateExamByAI(text)
            setState(s => ({ ...s, isSummarizing: false, sidebarActive: 'exam', sidebarVisible: true }))
            instance.on?.({ state: { exam: res.id }, type: 'stateChange' })
            return
          } catch (e) {
            if (typeof e === 'string') {
              toast.error(t(e))
            }
            setState(s => ({ ...s, isSummarizing: false }))
            return Promise.reject(e)
          }
        } else {
          toast.error(t(trans.AI.NoTextAvailable))
        }
      },
      summarize: async () => {
        const text = getText()
        if (!text) {
          toast.error(t(trans.AI.NoTextAvailable))
          return Promise.reject()
        }
        const pdfId = instance.getId()
        const pdfMeta = MetaStore.getMetaObjectByObjectId(pdfId)
        if (!pdfMeta) return Promise.reject()
        const controller = new AbortController()
        if (controllerRef.current) {
          controllerRef.current.abort()
        }
        controllerRef.current = controller
        const content = instance.values.texts.map(i => ({
          pageNumber: i.page,
          text: i.str
        }))
        setState(s => ({ ...s, isSummarizing: true }))
        try {
          const res = await summarizePDF(
            {
              title: pdfMeta.name ?? '',
              pages: content
            },
            controller.signal
          )
          setState(s => ({ ...s, isSummarizing: false, sidebarActive: 'summary', sidebarVisible: true }))
          instance.on?.({ state: { aiSummary: res }, type: 'stateChange' })
          return res
        } catch (e) {
          if (typeof e === 'string') {
            toast.error(t(e))
          }
          setState(s => ({ ...s, isSummarizing: false }))
          return Promise.reject(e)
        } finally {
          controllerRef.current = undefined
        }
      },
      mindmap: async () => {
        const content = instance.values.texts.map(i => i.str).join(' ')
        try {
          const res = await mindmapPDF(content, AIService.getAIOutputLanguage())
          console.log(res)
          instance.on?.({
            state: { aiSummary: { ...state.document?.aiSummary, mindmap: res } },
            type: 'stateChange'
          })
          return res
        } catch (e) {
          if (typeof e === 'string') {
            toast.error(t(e))
          }
          return Promise.reject(e)
        }
      }
    }
  })
}
