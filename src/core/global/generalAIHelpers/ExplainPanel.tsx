import { Content, Icon, Markdown } from '@/components'
import { Icons } from '@/consts'
import { useGlobalAtom } from '@/hooks'
import { atom, Provider } from 'jotai'
import { memo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { IGeneralSource } from '~/typings'
import { assignProperties } from '@/utils'
import Id from '@/utils/id'
import { AIService } from '@/api/services'
import GeneralPanelFooter from '@/core/global/generalAIHelpers/GeneralPanelFooter'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import addSourceAsLabel from '@/core/global/common/addSourceAsLabel'
import useGeneralPanel from '@/core/global/generalAIHelpers/useGeneralPanel'
import GeneralPanelHeader from '@/core/global/generalAIHelpers/GeneralPanelHeader'
import fileSystem from '@/api/fileSystem'
import navigateToSource from '@/core/global/common/navigateToSource'
import UserService from '@/api/services/user.service'
import { GlobalSetting } from '@/core'
import { CoreMessage } from 'ai'

type ExplainResult = {
  id: number
  originalText: string
  result: string
  source?: IGeneralSource
  time: number
  metaId?: number
  prompt: string
  image?: string
}

const getExplainPrompt = (query?: string, image?: string): string | CoreMessage['content'] | undefined => {
  const language = AIService.getAIOutputLanguage()
  if (image) {
    return [
      {
        type: 'text',
        text: `Analyze the following image and provide a detailed explanation of its content. I am the owner of this image and the data it contains is public. Describe what is depicted in the image. Identify any objects, scenes, or text present. If there are any charts or graphs, analyze the trends shown, highlighting significant patterns or changes. Offer conclusions and context information based on the overall content of the image. Output only explaination, and in ${language}.`
      },
      {
        type: 'image',
        image
      }
    ]
  }
  if (query) {
    const custom = GlobalSetting.getSetting().AI.customExplainPrompt
    if (custom) {
      return `${custom}. Output explaination in ${language}. Here is the content: ${query}`
    }
    return `Please explain the meaning of the following content. Include some background information and clarify complex concepts if necessary. Output explaination in ${language}. Here is the content: ${query}`
  }
}
const ExplainStateAtom = atom<{
  allResults: ExplainResult[]
  currentResult?: ExplainResult
  loading?: boolean
  pinned?: boolean
}>({})

export default memo(() => {
  return (
    <Provider>
      <ExplainPanel />
    </Provider>
  )
})

const ExplainPanel = () => {
  const abortRef = useRef<AbortController>()
  assignProperties(Global, {
    aiOps: {
      ...Global.aiOps,
      toggleExplainer: v => setVisible(v),
      explain: async ({ source, query, e, pos: outPos, image, targetChatId, initialMessages }) => {
        if (!query && !image) return
        const isPro = UserService.isUserPro(true)
        if (!isPro) {
          toast.error(t(trans.Errors.NotProUser))
          return
        }
        const prompt = getExplainPrompt(query, image)
        if (!prompt) return
        const chatVisible = targetChatId || Global.aiOps?.isChatOpen?.()
        if (chatVisible) {
          Global.aiOps?.chat?.({
            initialMessages,
            targetChatId,
            source: source,
            contextCount: 2,
            messages: [
              {
                role: 'user',
                source: source,
                type: 'explain',
                content: prompt
              }
            ],
            getResponse: true
          })
          return
        }
        setTimeout(() => setVisible(true))
        if (abortRef.current) {
          abortRef.current.abort()
        }
        const controller = new AbortController()
        abortRef.current = controller
        handlePosChange?.({
          e,
          pos: outPos
        })
        setExplainState(s => ({ ...s, loading: true }))
        const newResult = {
          id: Id.getId(),
          originalText: query,
          source,
          result: '',
          time: Date.now(),
          prompt,
          image
        } as ExplainResult
        try {
          let textResult = ''
          await AIService.chatStream(prompt, {
            onLoad: text => {
              textResult += text
              setExplainState(s => {
                return {
                  ...s,
                  currentResult: { ...newResult, result: textResult },
                  loading: false
                }
              })
            },
            signal: controller.signal
          })
        } catch (e) {
          setExplainState(s => ({ ...s, loading: false }))
        }
      }
    }
  })
  const [explainState, setExplainState] = useGlobalAtom(ExplainStateAtom)
  const { setVisible, handlePosChange, renderFloated, panelState } = useGeneralPanel({
    size: {
      width: 360,
      height: 300
    },
    pinned: explainState.pinned
  })
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const shouldDeleteImageRef = useRef(true)
  // delete temp image
  useEffect(() => {
    if (panelState.visible === false) {
      if (shouldDeleteImageRef.current === false) {
        shouldDeleteImageRef.current = true
        return
      }
      if (explainState.currentResult?.image) {
        let shouldDelete = false
        const source = explainState.currentResult.source
        if (source?.type === 'pdf') {
          if (!source.labelId) {
            shouldDelete = true
          }
        }
        if (shouldDelete) {
          fileSystem.fs.deleteFile(explainState.currentResult.image)
        }
      }
    }
  }, [panelState.visible])
  const replaceCurrentResult = (updater: (curr: ExplainResult) => ExplainResult) => {
    setExplainState(s => {
      return s.currentResult
        ? {
            ...s,
            currentResult: updater(s.currentResult)
          }
        : s
    })
  }

  const renderPanel = () => {
    if (explainState.loading) {
      return (
        <Content flex auto centered>
          <Content className={'font-size-16 normal-font'} style={{ marginTop: -30 }} flex gap={16}>
            <Icon name={Icons.Loading} size={24} spin />
          </Content>
        </Content>
      )
    }
    return (
      <div ref={panelRef} className={'h-0 flex-auto flex flex-col gap-2 pb-2'}>
        {explainState.currentResult?.source && (
          <div className={'px-3'}>
            <SourceRenderer query={explainState.currentResult.originalText} source={explainState.currentResult.source} />
          </div>
        )}
        <div className={'overflow-y-auto h-0 px-3 flex-auto pb-6'}>
          <Markdown className={'markdown font-size-13'}>{explainState.currentResult?.result}</Markdown>
        </div>
        <GeneralPanelFooter
          showLabel={!!explainState.currentResult?.source}
          hasLabel={!!explainState.currentResult?.metaId}
          on={async type => {
            const current = explainState.currentResult
            if (!current) return
            switch (type) {
              case 'chat': {
                shouldDeleteImageRef.current = false
                setVisible(false)
                Global.aiOps?.chat?.({
                  source: current.source,
                  messages: [
                    {
                      role: 'user',
                      source: current.source,
                      type: 'explain',
                      content: current.prompt
                    },
                    {
                      role: 'assistant',
                      content: current.result
                    }
                  ]
                })
                break
              }
              case 'copy': {
                const value = explainState.currentResult?.result
                if (value) {
                  navigator.clipboard.writeText(value)
                  toast.success(t(trans.Copied))
                }
                break
              }
              case 'addAsObject': {
                shouldDeleteImageRef.current = false
                const result = explainState.currentResult
                if (result?.metaId) {
                  Global.metaOps?.openDetails(result.metaId)
                  return
                }
                if (result && result.source && !result.metaId) {
                  const metaId = await addSourceAsLabel(result.originalText, result.result, result.source)
                  if (metaId) {
                    replaceCurrentResult(c => ({ ...c, metaId }))
                    toast.success(t(trans.Success.AddedSuccessfully))
                  }
                }
                break
              }
            }
          }}
        />
      </div>
    )
  }
  return renderFloated(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%'
      }}
    >
      <GeneralPanelHeader
        name={t(trans.Explain)}
        pinActive={explainState.pinned}
        on={type => {
          if (type === 'pin') {
            setExplainState(s => ({ ...s, pinned: !s.pinned }))
          }
          if (type === 'close') {
            setVisible(false)
          }
        }}
      />
      {renderPanel()}
    </div>
  )
}
const SourceRenderer = ({ source, query }: { source: IGeneralSource; query: string }) => {
  return (
    <div
      onClick={() => navigateToSource(source)}
      className={'transparent-font shrink-0 cursor-pointer text-xs line-clamp-1 border-l-yellow-500'}
      style={{
        borderLeftWidth: 2,
        paddingLeft: 6,
        borderLeftStyle: 'solid'
      }}
    >
      {query}
    </div>
  )
}
