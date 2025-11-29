import { Content, Icon, WithBorder } from '@/components'
import { Icons, Zindexes } from '@/consts'
import { GlobalInstance, useGlobalAtom, useShortcut } from '@/hooks'
import TranslateService from '@/api/services/translate.service'
import { MetaStore } from '@/api/stores'
import { atom } from 'jotai'
import { memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'
import { XYPosition } from '~/typings'
import DateFormat from '@/utils/dateFormat'
import { getPanelPosition } from '../utils'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { assignProperties } from '@/utils'
import Id from '@/utils/id'

type TranslateResult = {
  id: number
  originalText: string
  translatedText: { trans: string; orig: string }[]
  source?: TranslateSource
  time: number
}
const TranslateStateAtom = atom<{
  visible: boolean
  allResults: TranslateResult[]
  currentResult?: TranslateResult
  loading?: boolean
}>({
  visible: false,
  allResults: []
})

const TranslatePanelStateAtom = atom<{
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

const PanelDefaultSize = {
  x: window.innerWidth / 2 - 200,
  y: window.innerHeight / 2 - 200,
  width: 380,
  height: 280
}
const GlobalTranslateResult = memo(() => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(TranslatePanelStateAtom)

  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      toggleTranslator: v => {
        setTranslateState(s => ({ ...s, visible: v }))
      },
      translate: async ({ source, query, e, pos: outPos }) => {
        const pos =
          !translateState.visible &&
          getPanelPosition({
            e: e,
            pos: outPos,
            defaultSize: panelState.size || PanelDefaultSize
          })
        setTranslateState(s => ({ ...s, visible: true, loading: true }))
        setPanelState(s => ({
          ...s,
          showHistory: false,
          currentPosition: pos || s.currentPosition
        }))
        const newResult = {
          id: Id.getId(),
          originalText: query,
          source,
          translatedText: [],
          time: Date.now()
        } as TranslateResult
        try {
          await TranslateService.translateTextStream(query, text => {
            setTranslateState(s => {
              const target = structuredClone(s.allResults.find(i => i.id === newResult.id) || newResult) as TranslateResult
              let first = target.translatedText.length === 0
              target.translatedText = [
                {
                  trans: (target.translatedText[0]?.trans ?? '') + text,
                  orig: ''
                }
              ]
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
          setTranslateState(s => ({ ...s, loading: false }))
        }
      }
    }
  })

  useShortcut('openTranslatePanel', () => {
    setTranslateState(s => ({ ...s, visible: !s.visible }))
  })

  return createPortal(translateState.visible && <TranslatePanel />, document.body)
})

const TranslatePanel = () => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(TranslatePanelStateAtom)
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)

  const renderHistory = () => {
    return (
      <Content flex auto column className={'gap-3'} style={{ overflowY: 'auto', padding: '0px 12px 12px' }}>
        {translateState.allResults.map(i => (
          <Content
            className={'not-last-not-empty-border-bottom pb-3 gap-1 cursor-pointer'}
            column
            flex
            onClick={() => {
              setTranslateState(s => ({ ...s, currentResult: i }))
              setPanelState(s => ({ ...s, showHistory: false }))
            }}
            key={i.id}
          >
            {i.source && <SourceRenderer query={i.originalText} source={i.source} />}
            <div className={'line-clamp-1 font-size-13'}>{i.translatedText.map(i => i.trans).join(' ')}</div>
            <div className={'transparent-font text-xs'}>{DateFormat.formatDistanceToNowStrict(i.time, true)}</div>
          </Content>
        ))}
      </Content>
    )
  }
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
      <div ref={panelRef} className={'h-0 flex-auto flex flex-col gap-2'} style={{ padding: '0px 12px 12px' }}>
        {translateState.currentResult?.source && (
          <SourceRenderer query={translateState.currentResult.originalText} source={translateState.currentResult.source} />
        )}
        <div className={'overflow-y-auto h-0 flex-auto'}>
          <p style={{ marginBottom: '0.5em', width: 'fit-content' }}>{translateState.currentResult?.translatedText[0]?.trans}</p>
        </div>
      </div>
    )
  }
  return (
    <ResizeAndDrag
      role="global-translate-panel"
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
              className={'square-button'}
              size={16}
              data-active={panelState.showHistory || undefined}
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
                GlobalInstance.commonOps?.toggleTranslator?.(false)
              }}
            />
          </Content>
        </div>
        {panelState.showHistory ? renderHistory() : renderPanel()}
      </WithBorder>
    </ResizeAndDrag>
  )
}
const SourceRenderer = ({ source, query }: { source: TranslateSource; query: string }) => {
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
export default GlobalTranslateResult
