import { Content, Icon, WithBorder } from '@/components'
import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import { Zindexes } from '@/consts'
import { GlobalInstance, useGlobalAtom, useShortcut } from '@/hooks'
import TranslateService from '@/api/services/translate.service'
import { globalStore, MetaStore } from '@/api/stores'
import { objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta/meta.store'
import ClassName from '@/styles/classNames'
import classnames from 'classnames'
import { atom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'
import { GlobalInstances, XYPosition } from '~/typings'
import DateFormat from '@/utils/dateFormat'
import { getPanelPosition } from '../utils'
import { getUser } from '@/api/services/login.service'
import { toast } from 'react-hot-toast'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import { assignProperties } from '@/utils'
import { Rendevoz } from '../../rendevoz'

type TranslateResult = {
  originalText: string
  translatedText: { trans: string; orig: string }[]
  from?: string
  to: 'zh'
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
  showOrigin?: boolean
  showHistory?: boolean
  doubleRowLayout?: boolean
  ref?: Rnd
}>({
  draggable: true,
  showOrigin: false,
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

export const GlobalTranslateInstance: Partial<GlobalInstances.TranslateInstance> = {}
const PanelDefaultSize = {
  x: window.innerWidth / 2 - 200,
  y: window.innerHeight / 2 - 200,
  width: 400,
  height: 400
}
const GlobalTranslateResult = () => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(TranslatePanelStateAtom)
  assignProperties(GlobalTranslateInstance, {
    open: options => {
      const user = getUser()
      if (!user) {
        toast.error('登录以后才可以使用翻译！')
        return
      }
      const pos =
        !translateState.visible &&
        getPanelPosition({
          e: options.e,
          pos: options.pos,
          defaultSize: panelState.size || PanelDefaultSize
        })
      setTranslateState(s => ({ ...s, visible: true }))
      setPanelState(s => ({
        ...s,
        currentPosition: pos || s.currentPosition
      }))
      Rendevoz.Actions.State.Translate.translate(options)
    },
    translate: async ({ from, query, to, source }) => {
      const newResult = {
        originalText: query,
        from: from,
        to: to,
        source,
        time: Date.now()
      } as TranslateResult
      setTranslateState(s => ({ ...s, loading: true }))
      try {
        const result = await TranslateService.localTranslate(query, to, from)
        // newResult.translatedText = normalizeTranslateResult(result.result)
        newResult.translatedText = [
          {
            trans: result,
            orig: ''
          }
        ]
        setTranslateState(s => {
          s.currentResult = newResult
          s.allResults.unshift(newResult)
          return { ...s, allResults: [...s.allResults], loading: false }
        })
      } catch (e) {
        setTranslateState(s => ({ ...s, loading: false }))
      }
    },
    close: () => setTranslateState(s => ({ ...s, visible: false }))
  })

  useShortcut('openTranslatePanel', () => {
    setTranslateState(s => ({ ...s, visible: !s.visible }))
  })

  return createPortal(translateState.visible && <TranslatePanel />, document.body)
}

const TranslatePanel = () => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(TranslatePanelStateAtom)
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const panel = panelRef.current
    if (panel) {
      panel.scrollTop = 0
    }
  }, [translateState.currentResult?.translatedText])
  const renderHistory = () => {
    return (
      <Content flex auto column gap={8} style={{ overflowY: 'auto', padding: '0px 12px 12px' }}>
        {translateState.allResults.map(i => (
          <Content column flex key={i.time}>
            <Content
              style={{ marginBottom: 2 }}
              gap={10}
              flex
              alignItems={'center'}
              justifyContent={'space-between'}
              className={'transparent-font font-size-12'}
            >
              {i.source && <SourceRenderer small source={i.source} />}
              <Content alignItems="center" flex gap={8} style={{ flexShrink: 0 }}>
                <div>{DateFormat.formatDistanceToNowStrict(i.time, true)}</div>
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setPanelState(s => ({
                      ...s,
                      showHistory: false
                    }))
                    setTranslateState(s => ({ ...s, currentResult: i }))
                  }}
                >
                  {t('translate.show this translate result')}
                </div>
              </Content>
            </Content>

            <div className={ClassName.ellipsisFont(3)}>{i.translatedText.map(i => i.trans).join(' ')}</div>
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
            <Icon name="park-loading-four" spin />
            <div>{t('general.translating')}...</div>
          </Content>
        </Content>
      )
    }
    return (
      <Content ref={panelRef} flex auto column gap={6} style={{ overflowY: 'auto', padding: '0px 12px 12px' }}>
        {translateState.currentResult?.source && <SourceRenderer source={translateState.currentResult.source} />}
        {panelState.doubleRowLayout ? (
          <>
            <div className={'transparent-font font-size-12 normal-font'}>{t('translate.original text')}</div>
            {translateState.currentResult?.originalText}
            <div className={'transparent-font font-size-12 normal-font'}>{t('translate.translated text')}</div>
            <div>
              {translateState.currentResult?.translatedText.map(i => (
                <p style={{ marginBottom: '0.5em', width: 'fit-content' }}>{i.trans}</p>
              ))}
            </div>
          </>
        ) : panelState.showOrigin ? (
          <div
            style={{
              whiteSpace: 'pre-wrap'
            }}
          >
            {translateState.currentResult?.originalText}
          </div>
        ) : (
          <div>
            {translateState.currentResult?.translatedText.map(i => (
              <p style={{ marginBottom: '0.5em', width: 'fit-content' }}>{i.trans}</p>
            ))}
          </div>
        )}
      </Content>
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
        zIndex: Zindexes.TranslatePanel
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
            <Icon size={15} name={'park-translate'} />
            <div className={'font-size-14 normal-font'}>{t('general.Translator')}</div>
          </Content>
          <Content flex gap={6} alignItems="center" className={'transparent-font'}>
            {!panelState.showHistory && (
              <>
                {!panelState.doubleRowLayout && (
                  <Icon
                    className={ClassName.flatButton(4, '4px')}
                    size={16}
                    data-active={panelState.showOrigin || undefined}
                    onClick={() => {
                      setPanelState(s => ({
                        ...s,
                        showOrigin: !s.showOrigin
                      }))
                    }}
                    name="park-switch"
                    tooltip={t('translate.show original')}
                  />
                )}
                <Icon
                  className={ClassName.flatButton(4, '4px')}
                  size={16}
                  data-active={panelState.doubleRowLayout || undefined}
                  onClick={() => {
                    setPanelState(s => ({
                      ...s,
                      doubleRowLayout: !s.doubleRowLayout
                    }))
                  }}
                  name="park-layout-two"
                  tooltip={t('translate.double row layout')}
                />
              </>
            )}

            <Icon
              className={ClassName.flatButton(4, '4px')}
              size={16}
              data-active={panelState.showHistory || undefined}
              name="park-history"
              tooltip={t('translate.history')}
              onClick={() => {
                setPanelState(s => ({ ...s, showHistory: !s.showHistory }))
              }}
            />
            <Icon
              className={ClassName.flatButton(4, '4px')}
              size={16}
              name="park-close"
              tooltip={t('general.close')}
              onClick={() => {
                GlobalTranslateInstance.close?.()
              }}
            />
          </Content>
        </div>
        {panelState.showHistory ? renderHistory() : renderPanel()}
      </WithBorder>
    </ResizeAndDrag>
  )
}
const SourceRenderer = ({ source, small }: { source: TranslateSource; small?: boolean }) => {
  const [sourceState, setSourceState] = useState<{
    name?: string
    icon?: string
  }>()
  const { t } = useTranslation()
  const handleNaivgate = async () => {
    const { type, objectId } = source
    const meta = MetaStore.getMetaObjectByObjectId(objectId)
    if (meta) {
      if (source.type === 'pdf') {
        const i = await GlobalInstance.layoutOps?.openObject<'pdf'>(meta.id)
        if (i && source.page !== undefined) {
          i.navigateOps?.jumpToPage(source.page)
        }
      } else {
        meta && Rendevoz.Actions.Open.Meta.openMetaObject(meta.id)
      }
    }
  }
  useEffect(() => {
    if (source === undefined) {
      setSourceState(undefined)
    }
    const setState = async () => {
      const metaOne = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(source.objectId)

      if (!metaOne) {
        setSourceState(undefined)
        return
      }
      const meta = await MetaStore.getMetaObjectById(metaOne)
      if (!meta) {
        setSourceState(undefined)
        return
      }
      setSourceState(() => {
        const s = {
          name: meta.name || 'Unnamed Object',
          icon: Rendevoz.Utils.Object.getMetaObjectIcon(meta.type, meta)
        }
        switch (source.type) {
          case 'pdf': {
            if (source.page !== undefined) {
              s.name += ' ' + t('general.page') + ':' + (source.page + 1)
            }
            break
          }
        }
        return s
      })
    }
    setState()
  }, [source])
  if (!sourceState?.name) return null
  return (
    <IconNameItem
      onClick={handleNaivgate}
      className={classnames('transparent-font', small ? 'font-size-12' : 'font-size-13', 'pointer', 'text-hover-underline')}
      style={{ cursor: 'pointer' }}
      icon={sourceState?.icon}
      name={sourceState?.name}
    />
  )
}
export default GlobalTranslateResult
