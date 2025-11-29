import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import useEditorState from '../hooks/useEditorState'
import { Node } from 'slate'
import summarizeEditor from '../components/AI/summarizeEditor'
import mindmapEditor from '../components/AI/mindmapEditor'
import trans from '@/consts/trans'
import { AIService } from '@/api/services'
import { slateToMarkdown } from '../plugins/slateToMarkdown'
import generateExamByAI from '@/core/components/exam/generateExamByAI'

export default (instance: IEditorInstance, editor: CustomEditor) => {
  const [state, setState] = useEditorState()
  const controllerRef = useRef<AbortController>()
  const { t } = useTranslation()
  const getText = () => {
    return slateToMarkdown(editor.children).trim()
  }
  assignProperties(instance, {
    aiOps: {
      getActiveChatId: ignoreVisible => {
        if ((state.sidebarVisible && state.sidebarActive === 'ai') || ignoreVisible) {
          return state.state?.aiChat?.currentChat
        }
      },
      getInitialMessages: () => {
        const text = instance.serialize().trim()
        return text
          ? [
              {
                role: 'system',
                content:
                  "Based on the content of the following document, provide professional, accurate, and well-structured responses to the user's questions. Ensure that your answers are clear, concise, and supported by the information in the document. The content is as follows: " +
                  text
              }
            ]
          : []
      },
      scrollToMessage: id => {
        setState(s => ({ ...s, currentFocusChatMessageId: id, sidebarActive: 'ai', sidebarVisible: true }))
        setTimeout(() => setState(s => ({ ...s, currentFocusChatMessageId: undefined })), 500)
      },
      scrollToQuestion: id => {
        setState(s => ({ ...s, currentFocusExamQuestionId: id, sidebarActive: 'exam', sidebarVisible: true }))
        setTimeout(
          () =>
            setState(s => ({
              ...s,
              currentFocusExamQuestionId: s.currentFocusExamQuestionId === id ? undefined : s.currentFocusExamQuestionId
            })),
          1500
        )
      },
      exam: async () => {
        const text = getText()
        if (!text) {
          toast.error(t(trans.AI.NoTextAvailable))
          return Promise.reject()
        }
        setState(s => ({ ...s, isSummarizing: true }))
        try {
          const res = await generateExamByAI(text)
          await instance.on({
            type: 'updateNote',
            updater: c => ({ ...c, exam: res.id })
          })
          setState(s => ({ ...s, isSummarizing: false, sidebarActive: 'exam', sidebarVisible: true }))
          return
        } catch (e) {
          if (typeof e === 'string') {
            toast.error(t(e))
          }
          setState(s => ({ ...s, isSummarizing: false }))
          return Promise.reject()
        }
      },
      summarize: async () => {
        const text = getText()
        if (!text) {
          toast.error(t(trans.AI.NoTextAvailable))
          return Promise.reject()
        }
        const controller = new AbortController()
        if (controllerRef.current) {
          controllerRef.current.abort()
        }
        controllerRef.current = controller
        const content = editor.children
          .map(i => ({
            id: i.id,
            text: Node.string(i)
          }))
          .filter(i => i.text.trim())
        setState(s => ({ ...s, isSummarizing: true }))
        try {
          const res = await summarizeEditor(
            {
              paragraphs: content,
              title: instance.getTitle?.() ?? ''
            },
            AIService.getAIOutputLanguage(),
            controller.signal
          )
          await instance.on({
            type: 'AI summarize',
            summary: res
          })
          setState(s => ({ ...s, isSummarizing: false, sidebarActive: 'summary', sidebarVisible: true }))
          return res
        } catch (e) {
          if (typeof e === 'string') {
            toast.error(t(e))
          }
          setState(s => ({ ...s, isSummarizing: false }))
          return Promise.reject()
        } finally {
          controllerRef.current = undefined
        }
      },
      mindmap: async () => {
        const currentSummary = state.aiSummary
        if (!currentSummary) {
          toast.error('You need to summarize first!')
          return Promise.reject()
        }
        const content = editor.children
          .map(i => Node.string(i))
          .filter(i => i.trim())
          .join('\n')
        if (!content.length) {
          toast.error('No content!')
          return Promise.reject()
        }
        try {
          const res = await mindmapEditor(content, 'Chinese')
          instance.on({
            type: 'AI summarize',
            summary: { ...currentSummary, mindmap: res }
          })
          return res
        } catch (e) {
          if (typeof e === 'string') {
            toast.error(t(e))
          }
          return Promise.reject()
        }
      }
    }
  })
}
