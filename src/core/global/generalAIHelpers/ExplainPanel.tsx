import { Content, Icon, WithBorder } from '@/components'
import { Icons, Zindexes } from '@/consts'
import { GlobalInstance, useGlobalAtom, useShortcut } from '@/hooks'
import { MetaStore } from '@/api/stores'
import { atom } from 'jotai'
import { memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'
import { IGeneralSource, XYPosition } from '~/typings'
import DateFormat from '@/utils/dateFormat'
import { getPanelPosition } from '../utils'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { assignProperties } from '@/utils'
import Id from '@/utils/id'
import { AIService } from '@/api/services'
import Markdown from 'react-markdown'
import GeneralPanelFooter from '@/core/global/components/GeneralPanelFooter'
import classnames from 'classnames'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'
import addSourceAsLabel from '@/core/global/common/addSourceAsLabel'
type ExplainResult = {
  id: number
  originalText: string
  result: string
  source?: IGeneralSource
  time: number
  metaId?: number
}

const getExplainPrompt = (query: string, language: string) => {
  return `Please explain the meaning concisely of the following text. Make sure to include some necessary background information and clarify complex concepts if necessary. Output explaination in ${language}. Here is the text: ${query}`
}
const ExplainStateAtom = atom<{
  visible: boolean
  allResults: ExplainResult[]
  currentResult?: ExplainResult
  loading?: boolean
}>({
  visible: false,
  allResults: []
})

const PanelStateAtom = atom<{
  draggable: boolean
  currentPosition?: XYPosition
  size?: {
    width: number
    height: number
  }
  showHistory?: boolean
  ref?: Rnd
}>({
  draggable: true,
  showHistory: false
})

const PanelDefaultSize = {
  x: window.innerWidth / 2 - 200,
  y: window.innerHeight / 2 - 200,
  width: 380,
  height: 400
}
export default memo(() => {
  const [explainState, setExplainState] = useGlobalAtom(ExplainStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(PanelStateAtom)

  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      toggleExplainer: v => {
        setExplainState(s => ({ ...s, visible: v }))
      },
      explain: async ({ source, query, e, pos: outPos }) => {
        const pos =
          !explainState.visible &&
          getPanelPosition({
            e: e,
            pos: outPos,
            defaultSize: panelState.size || PanelDefaultSize
          })
        setExplainState(s => ({ ...s, visible: true, loading: true }))
        setPanelState(s => ({
          ...s,
          showHistory: false,
          currentPosition: pos || s.currentPosition
        }))
        const newResult = {
          id: Id.getId(),
          originalText: query,
          source,
          result: '',
          time: Date.now()
        } as ExplainResult
        try {
          await AIService.askStream(getExplainPrompt(query, AIService.getAIOutputLanguage()), text => {
            setExplainState(s => {
              const target = structuredClone(s.allResults.find(i => i.id === newResult.id) || newResult) as ExplainResult
              let first = target.result === ''
              target.result = (target.result || '') + text
              const newResults = [...s.allResults]
              if (!newResults.some(i => i.id === target.id)) {
                newResults.unshift(target)
              } else {
                const idx = newResults.findIndex(i => i.id === target.id)
                newResults[idx] = target
              }
              return {
                ...s,
                currentResult: first ? target : s.currentResult?.id === target.id ? target : s.currentResult || target,
                allResults: newResults,
                loading: first ? false : s.loading
              }
            })
          })
        } catch (e) {
          setExplainState(s => ({ ...s, loading: false }))
        }
      }
    }
  })

  useShortcut('openTranslatePanel', () => {
    setExplainState(s => ({ ...s, visible: !s.visible }))
  })

  return createPortal(explainState.visible && <ExplainPanel />, document.body)
})

const ExplainPanel = () => {
  const [explainState, setExplainState] = useGlobalAtom(ExplainStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(PanelStateAtom)
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const replaceCurrentResult = (updater: (curr: ExplainResult) => ExplainResult) => {
    setExplainState(s => {
      const idx = s.allResults.findIndex(i => i.id === s.currentResult?.id)
      if (s.currentResult && idx >= 0) {
        const sliced = s.allResults.slice()
        sliced[idx] = updater(s.currentResult)
        return {
          ...s,
          currentResult: updater(s.currentResult),
          allResults: sliced
        }
      }
      return s
    })
  }
  const renderHistory = () => {
    return (
      <Content flex auto column className={'gap-3'} style={{ overflowY: 'auto', padding: '0px 12px 12px' }}>
        {explainState.allResults.map(i => (
          <Content
            className={'not-last-not-empty-border-bottom pb-3 gap-1 cursor-pointer'}
            column
            flex
            onClick={() => {
              setExplainState(s => ({ ...s, currentResult: i }))
              setPanelState(s => ({ ...s, showHistory: false }))
            }}
            key={i.id}
          >
            {i.source && <SourceRenderer query={i.originalText} source={i.source} />}
            <div className={'line-clamp-1 font-size-13'}>{i.result}</div>
            <div className={'transparent-font text-xs'}>{DateFormat.formatDistanceToNowStrict(i.time, true)}</div>
          </Content>
        ))}
      </Content>
    )
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
          <div
            style={{
              padding: '0px 12px'
            }}
          >
            <SourceRenderer query={explainState.currentResult.originalText} source={explainState.currentResult.source} />
          </div>
        )}
        <div
          style={{
            padding: '0px 12px'
          }}
          className={'overflow-y-auto h-0 flex-auto'}
        >
          <Markdown>{explainState.currentResult?.result}</Markdown>
        </div>
        <GeneralPanelFooter
          on={async type => {
            switch (type) {
              case 'copy': {
                const value = explainState.currentResult?.result
                if (value) {
                  navigator.clipboard.writeText(value)
                  toast.success(t(trans.Copied))
                }
                break
              }
              case 'tag': {
                const result = explainState.currentResult
                if (result && result.source) {
                  const metaId = result.metaId || (await addSourceAsLabel(result.originalText, result.result, result.source))
                  if (metaId) {
                    replaceCurrentResult(c => ({ ...c, metaId }))
                    GlobalInstance.metaOps?.quickAdd(metaId, 'tags')
                  }
                }
                break
              }
              case 'addAsObject': {
                const result = explainState.currentResult
                if (result && result.source && !result.metaId) {
                  const metaId = await addSourceAsLabel(result.originalText, result.result, result.source)
                  if (metaId) {
                    replaceCurrentResult(c => ({ ...c, metaId }))
                    toast.success(t(trans.Success.AddedSuccessfully))
                  }
                }
                break
              }
              case 'moveTo': {
                const result = explainState.currentResult
                if (result && result.source) {
                  const metaId = result.metaId || (await addSourceAsLabel(result.originalText, result.result, result.source))
                  if (metaId) {
                    replaceCurrentResult(c => ({ ...c, metaId }))
                    GlobalInstance.metaOps?.quickAdd(metaId)
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
  return (
    <ResizeAndDrag
      role="global-explain-panel"
      ref={r => {
        r && !panelState.ref && setPanelState(s => ({ ...s, ref: r }))
      }}
      default={PanelDefaultSize}
      style={{
        borderRadius: 8,
        zIndex: Zindexes.GeneralPanel
      }}
      position={panelState.currentPosition}
      size={panelState.size}
      onResizeStop={(e, dir, ele, delta, pos) => {
        const bounding = ele.getBoundingClientRect()
        setPanelState(s => ({
          ...s,
          size: {
            width: bounding.width,
            height: bounding.height
          },
          currentPosition: pos
        }))
      }}
      onDragStop={(e, data) => {
        setPanelState(s => ({
          ...s,
          currentPosition: {
            x: data.x,
            y: data.y
          }
        }))
      }}
      dragHandleClassName="drag-handle"
    >
      <WithBorder
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          gap: 6
        }}
      >
        <div
          className={'drag-handle'}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            overflowX: 'auto',
            cursor: 'grab',
            flexShrink: 0,
            overflowY: 'hidden',
            padding: '8px 8px 0px 12px'
          }}
        >
          <Content flex gap={8} alignItems={'center'}>
            <div className={'font-size-14 normal-font'}>{t('general.Translator')}</div>
          </Content>
          <Content flex gap={6} alignItems="center" className={'transparent-font'}>
            <Icon
              className={classnames('square-button', panelState.showHistory && 'active-button')}
              size={16}
              name="park-history"
              tooltip={t('translate.history')}
              onClick={() => {
                setPanelState(s => ({ ...s, showHistory: !s.showHistory }))
              }}
            />
            <Icon
              className={'square-button'}
              size={16}
              name="park-close"
              tooltip={t('general.close')}
              onClick={() => {
                GlobalInstance.commonOps?.toggleExplainer?.(false)
              }}
            />
          </Content>
        </div>
        {panelState.showHistory ? renderHistory() : renderPanel()}
      </WithBorder>
    </ResizeAndDrag>
  )
}
const SourceRenderer = ({ source, query }: { source: IGeneralSource; query: string }) => {
  const handleNaivgate = async () => {
    const { objectId } = source
    const meta = MetaStore.getMetaObjectByObjectId(objectId)
    if (meta) {
      if (source.type === 'pdf') {
        const i = await GlobalInstance.layoutOps?.openObject<'pdf'>(meta.id)
        if (i && source.page !== undefined) {
          i.navigateOps?.jumpToPage(source.page)
        }
      } else {
        meta && GlobalInstance.layoutOps?.openObject(meta.id)
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
