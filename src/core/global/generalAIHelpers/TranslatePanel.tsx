import { Content, Icon } from '@/components'
import { Icons } from '@/consts'
import { useGlobalAtom } from '@/hooks'
import TranslateService from '@/api/services/translate.service'
import { MetaStore } from '@/api/stores'
import { atom, Provider } from 'jotai'
import { memo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { assignProperties } from '@/utils'
import Id from '@/utils/id'
import useGeneralPanel from '@/core/global/generalAIHelpers/useGeneralPanel'
import GeneralPanelHeader from '@/core/global/generalAIHelpers/GeneralPanelHeader'
import UserService from '@/api/services/user.service'
import { GlobalSetting } from '@/core'
import { ChatCompletionContentPart } from 'openai/resources'
import toast from 'react-hot-toast'

type TranslateResult = {
  id: number
  originalText: string
  result: string
  source?: TranslateSource
  time: number
}
const TranslateStateAtom = atom<{
  result?: TranslateResult
  pinned?: boolean
  loading?: boolean
}>({
  pinned: false
})
type TranslateSource =
  | {
      type: 'pdf'
      objectId: number
      page?: number
      selectedText?: string
    }
  | {
      type: 'note'
      objectId: number
      blockId?: number
    }
  | {
      type: 'webpage'
      objectId: number
      blockId?: number
    }

export default memo(() => {
  return (
    <Provider>
      <TranslatePanel />
    </Provider>
  )
})

const getTranslatePrompt = (query?: string, image?: string): ChatCompletionContentPart[] | string | undefined => {
  if (image) {
    return [
      {
        type: 'text',
        text: `Translate the following image to ${TranslateService.getTranslateLanguage(false)}. The output should only be the translated text.`
      },
      {
        type: 'image_url',
        image_url: {
          url: image,
          detail: 'low'
        }
      }
    ]
  }
  if (query) {
    const custom = GlobalSetting.getSetting().AI.customTranslatePrompt
    if (custom) {
      return `${custom}. Translate the following content to ${TranslateService.getTranslateLanguage(false)}. The output should only be the translated text.
Here is the content: ${query}`
    }
    return `Translate the following content to ${TranslateService.getTranslateLanguage(false)}. The output should only be the translated text.
Here is the content: ${query}`
  }
}
const TranslatePanel = () => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const { renderFloated, setVisible, handlePosChange } = useGeneralPanel({
    pinned: translateState.pinned
  })
  const { t } = useTranslation()
  const abortRef = useRef<AbortController>()
  assignProperties(Global, {
    commonOps: {
      ...Global.commonOps,
      toggleTranslator: v => setVisible(v),
      translate: async ({ source, query, e, pos: outPos, image, targetChatId }) => {
        const setting = GlobalSetting.getSetting()
        if (!query && image) {
          if (!(UserService.isUserPro(true) && setting.AI.aiTranslator)) {
            toast.error('Please enable AI translator!')
            return
          }
        }
        console.log(targetChatId)
        const chatVisible = targetChatId || Global.aiOps?.isChatOpen?.()
        const prompt = getTranslatePrompt(query, image)
        if (chatVisible && UserService.isUserPro(true) && setting.AI.aiTranslator) {
          if (!prompt) return
          Global.aiOps?.chat?.({
            source: source,
            targetChatId,
            contextCount: 0,
            messages: [
              {
                role: 'user',
                source: source,
                type: 'translate',
                content: prompt
              }
            ],
            getResponse: true
          })
          return
        }
        setTimeout(() => {
          setVisible(true)
        })
        handlePosChange?.({
          pos: outPos,
          e
        })
        setTranslateState(s => ({ ...s, loading: true }))
        const newResult = {
          id: Id.getId(),
          originalText: query,
          source,
          result: '',
          time: Date.now()
        } as TranslateResult
        try {
          const controller = new AbortController()
          if (abortRef.current) {
            abortRef.current.abort()
          }
          abortRef.current = controller
          let textResult = ''
          if (image) {
            await TranslateService.translateImageStream(
              image,
              text => {
                textResult += text
                setTranslateState(s => {
                  return {
                    ...s,
                    result: { ...newResult, result: textResult },
                    loading: false
                  }
                })
              },
              controller.signal
            )
            return
          }
          if (query) {
            await TranslateService.translateTextStream(
              query,
              text => {
                textResult += text
                setTranslateState(s => {
                  return {
                    ...s,
                    result: { ...newResult, result: textResult },
                    loading: false
                  }
                })
              },
              controller.signal
            )
          }
        } catch (e) {
          setTranslateState(s => ({ ...s, loading: false }))
        } finally {
          abortRef.current = undefined
        }
      }
    }
  })
  const renderPanel = () => {
    if (translateState.loading) {
      return (
        <Content flex auto centered>
          <Content className={'font-size-16 normal-font'} style={{ marginTop: -30 }} flex gap={16}>
            <Icon name={Icons.Loading} size={24} spin />
          </Content>
        </Content>
      )
    }
    return (
      <div className={'h-0 flex-auto flex flex-col gap-2 pt-0'}>
        {translateState.result?.source && (
          <div className={'px-3'}>
            <SourceRenderer query={translateState.result.originalText} source={translateState.result.source} />
          </div>
        )}
        <div className={'overflow-y-auto font-size-13 h-0 px-3 pb-3 flex-auto'}>
          <p style={{ marginBottom: '0.5em', width: 'fit-content' }}>{translateState.result?.result}</p>
        </div>
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
        on={type => {
          if (type === 'close') {
            setVisible(false)
          }
          if (type === 'pin') {
            setTranslateState(s => ({ ...s, pinned: !s.pinned }))
          }
        }}
        pinActive={!!translateState.pinned}
        name={t('general.Translator')}
      />
      {renderPanel()}
    </div>
  )
}

const SourceRenderer = ({ source, query }: { source: TranslateSource; query: string }) => {
  const handleNaivgate = async () => {
    const { objectId } = source
    const meta = MetaStore.getMetaObjectByObjectId(objectId)
    if (meta) {
      if (source.type === 'pdf') {
        const i = await Global.layoutOps?.openObject<'pdf'>(meta.id)
        if (i && source.page !== undefined) {
          i.navigateOps?.jumpToPage(source.page)
        }
      } else {
        meta && Global.layoutOps?.openObject(meta.id)
      }
    }
  }

  return (
    <div
      onClick={handleNaivgate}
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
