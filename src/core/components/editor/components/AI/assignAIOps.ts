import { IMediaInstance } from '~/typings'
import { assignProperties } from '@/utils'
import toast from 'react-hot-toast'
import summarizeMedia from '@/core/components/media/components/AI/summarizeMedia'
import { useTranslation } from 'react-i18next'
import mindmapMedia from '@/core/components/media/components/AI/mindmapMedia'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { useRef } from 'react'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'

export default (instance: IMediaInstance) => {
  const [mediaState, setMediaState] = useMediaState()
  const [, setSidebarState] = useMediaSidebarState()
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
      summarize: async () => {
        const controller = new AbortController()
        if (controllerRef.current) {
          controllerRef.current.abort()
        }
        controllerRef.current = controller
        const subtitle = await getSubtitle()
        if (subtitle) {
          setMediaState(s => ({ ...s, isSummarizing: true }))
          summarizeMedia(
            subtitle.map(i => ({ time: i.startTime, text: i.text })),
            'Chinese',
            controller.signal
          )
            .then(res => {
              controllerRef.current = undefined
              setSidebarState(s => ({ ...s, aiOpen: true }))
              instance.on?.({ type: 'aiSummarize', summary: res })
            })
            .catch(e => {
              controllerRef.current = undefined
              if (typeof e === 'string') {
                toast.error(t(e))
              }
            })
            .finally(() => {
              setMediaState(s => ({ ...s, isSummarizing: false }))
            })
        }
        return Promise.reject()
      },
      mindmap: async () => {
        const currentSummary = mediaState.aiSummary
        if (!currentSummary) {
          toast.error('You need to summarize first!')
          return Promise.reject()
        }
        const subtitle = await getSubtitle()
        if (subtitle) {
          mindmapMedia(
            subtitle.map(i => ({ text: i.text })),
            'Chinese'
          )
            .then(res => {
              instance.on?.({ type: 'aiSummarize', summary: { ...currentSummary, mindmap: res } })
            })
            .catch(e => {
              if (typeof e === 'string') {
                toast.error(t(e))
              }
            })
        }
        return Promise.reject()
      },
      cancelSummarize: () => {
        if (controllerRef.current) {
          controllerRef.current.abort()
          controllerRef.current = undefined
          setMediaState(s => ({ ...s, isSummarizing: false }))
        }
      }
    }
  })
}
