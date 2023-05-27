import { Button, Content, Icon, Tooltip } from '@/components'
import { IconNameItem } from '@/components/layout/sidebar/SidebarCollection'
import { getIcon } from '@/components/layout/sidebar/items/SidebarObjectItem'
import { Zindexes } from '@/consts'
import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import { useGlobalAtom } from '@/hooks'
import TranslateService from '@/services/translate.service'
import { MetaStore, globalStore } from '@/stores'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import classnames from 'classnames'
import { compareHotkey } from 'is-hotkey'
import { atom } from 'jotai'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'
import { XYPosition } from '~/typings'
import Actions from '../Actions'
import { css } from '@emotion/css'
import DateFormat from '@/utils/dateFormat'
import { goToBlock, selectBlock } from '../editor/utils'
import { useSetting } from '../setting'
import { getPanelPosition } from './utils'
import { getUser } from '@/services/login.service'
import { toast } from 'react-hot-toast'
import ResizeAndDrag from '@/components/base/ResizeAndDrag'
import getSetting from '../setting/getSetting'

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
export const GlobalTranslateInstance: {
  open?: (options: {
    query: string
    from?: string
    to: string
    pos?: XYPosition
    source?: TranslateSource
    e?: PointerEvent | MouseEvent
  }) => void
  translate?: (options: { query: string; from?: string; to: string; source?: TranslateSource }) => Promise<void>
  close?: VoidFunction
} = {}
const PanelDefaultSize = {
  x: window.innerWidth / 2 - 200,
  y: window.innerHeight / 2 - 150,
  width: 400,
  height: 300
}
const GlobalTranslateResult = () => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(TranslatePanelStateAtom)
  const [setting] = useSetting()
  Object.assign(GlobalTranslateInstance, {
    open: options => {
      const user = getUser()
      if (!user) {
        toast.error('登录以后才可以使用翻译！')
        return
      }
      const pos =
        !translateState.visible && getPanelPosition({ e: options.e, pos: options.pos, defaultSize: panelState.size || PanelDefaultSize })
      setTranslateState(s => ({ ...s, visible: true }))
      setPanelState(s => ({ ...s, currentPosition: pos || s.currentPosition }))
      GlobalTranslateInstance.translate?.(options)
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
        const result = await TranslateService.translate(query, to, from)
        //u201c u201d “ ”
        const reg = new RegExp('[\u3002\uff1b\uff0c\uff1a\u201c\u201d\u3001\uff1f\u300a\u300b]')
        newResult.translatedText = result.result
          .map(i => {
            const trans = i.trans.trim()
            console.log(trans)
            const endChar = trans[trans.length - 1]
            // if end char is any of the punc, split it
            if (reg.test(endChar)) {
              i.trans += '\r\n'
            }
            return i
          })
          .reduce(
            (whole, curr) => {
              const wholelast = whole[whole.length - 1]
              if (wholelast) {
                const removedWhole = wholelast.trans.replaceAll('\r\n', '').trim()
                const removedCurr = curr.trans.replaceAll('\r\n', '').trim()
                if (
                  removedWhole.includes('\u201c') &&
                  !removedWhole.endsWith('\u201d') &&
                  !removedWhole.endsWith('\u201c') &&
                  !removedWhole.includes('{xxx}')
                ) {
                  wholelast.orig += '' + curr.orig
                  wholelast.trans += '' + removedCurr
                  if (removedCurr.includes('\u201d')) {
                    console.log(removedCurr)
                    wholelast.trans += '{xxx}\r\n'
                  }
                  return whole
                }

                if (!wholelast.trans.endsWith('\r\n')) {
                  wholelast.orig += ' ' + curr.orig
                  wholelast.trans += ' ' + curr.trans
                  return whole
                }
              }
              whole.push(curr)
              return whole
            },
            [] as {
              trans: string
              orig: string
            }[]
          )
          .map(i => ({
            ...i,
            trans: i.trans.replaceAll('{xxx}', '')
          }))
        console.log(newResult.translatedText)
        setTranslateState(s => {
          s.currentResult = newResult
          s.allResults.unshift(newResult)
          return { ...s, allResults: [...s.allResults], loading: false }
        })
      } catch (e) {
        setTranslateState(s => ({ ...s, loading: false }))
        toast.error('Failed to translate!')
      }
    },
    close: () => setTranslateState(s => ({ ...s, visible: false }))
  } as typeof GlobalTranslateInstance)

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (setting.shortcut.openTranslatePanel && compareHotkey(setting.shortcut.openTranslatePanel, e)) {
        setTranslateState(s => ({ ...s, visible: !s.visible }))
      }
    }

    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [setting.shortcut.openTranslatePanel])
  return createPortal(translateState.visible && <TranslatePanel />, document.body)
}

const TranslatePanel = () => {
  const [translateState, setTranslateState] = useGlobalAtom(TranslateStateAtom)
  const [panelState, setPanelState] = useGlobalAtom(TranslatePanelStateAtom)
  const { t } = useTranslation()
  const [setting] = useSetting()
  const renderHistory = () => {
    return (
      <Content
        flex
        auto
        column
        gap={6}
        style={{ overflowY: 'auto', textTransform: 'none' }}
        className={css({
          '> div': {
            ':not(:first-child)': {
              padding: '6px 0px',
              ':not(:last-child)': {
                borderBottom: `1px solid ${Colors.Background.Border}`
              }
            }
          }
        })}
      >
        <div className={ClassName.description(FontSize['14px'])}>{translateState.allResults.length} Results</div>
        {translateState.allResults.map(i => (
          <Content column flex key={i.time}>
            {i.source && <SourceRenderer small source={i.source} />}
            <div className={ClassName.ellipsisFont(3)}>{i.translatedText.map(i => i.trans).join(' ')}</div>
            <Content alignItems="center" flex gap={10} className={ClassName.description(FontSize['12px'])}>
              <div>{DateFormat.formatDistanceToNowStrict(i.time)}</div>
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
        ))}
      </Content>
    )
  }
  const handleGotoOriginalPlace = (translateResult: TranslateResult, origText: string) => {
    const setting = getSetting()
    if (!setting.translate.autoGotoHoverText) return
    if (translateResult.source?.type === 'pdf') {
      const { objectId, page } = translateResult.source
      if (page !== undefined) {
        Actions.goToPdfSearchedText?.(origText, page, objectId)
      }
    }
    if (translateResult.source?.type === 'webpage') {
      Actions.goToWebpageSelectedText(translateResult.source.objectId, origText)
    }
  }
  const renderPanel = () => {
    if (translateState.loading) {
      return (
        <Content flex auto centered>
          <Content style={{ fontSize: FontSize['16px'], marginTop: -30 }} flex gap={16}>
            <Icon name="park-loading-four" spin />
            <div>{t('general.translating')}...</div>
          </Content>
        </Content>
      )
    }
    return (
      <Content
        flex
        auto
        column
        gap={8}
        style={{ overflowY: 'auto', textTransform: 'none', paddingRight: 12 }}
        // @ts-ignore
        className={css({
          '*': {
            textTransform: 'none !important'
          }
        })}
      >
        {translateState.currentResult?.source && <SourceRenderer source={translateState.currentResult.source} />}
        {panelState.doubleRowLayout ? (
          <>
            <div>{t('translate.original text')}</div>
            {translateState.currentResult?.originalText}
            <div>{t('translate.translated text')}</div>
            <div style={{ textIndent: '2em' }}>
              {translateState.currentResult?.translatedText.map(i => (
                <Tooltip
                  disable={!setting.translate.showOrigWhenHoverText}
                  onVisibleChange={v => {
                    if (v) {
                      handleGotoOriginalPlace(translateState.currentResult!, i.orig)
                    }
                  }}
                  delay={800}
                  contentTouchable
                  content={
                    <div
                      className={ClassName.description(FontSize['15px'])}
                      style={{
                        maxWidth: 400,
                        textTransform: 'none'
                      }}
                    >
                      {i.orig}
                    </div>
                  }
                >
                  <p style={{ marginBottom: '0.5em', width: 'fit-content' }}>{i.trans}</p>
                </Tooltip>
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
          <div style={{ textIndent: '2em' }}>
            {translateState.currentResult?.translatedText.map(i => (
              <Tooltip
                disable={!setting.translate.showOrigWhenHoverText}
                onVisibleChange={v => {
                  if (v) {
                    handleGotoOriginalPlace(translateState.currentResult!, i.orig)
                  }
                }}
                delay={800}
                contentTouchable
                content={
                  <div
                    className={ClassName.description(FontSize['15px'])}
                    style={{
                      maxWidth: 400,
                      textTransform: 'none'
                    }}
                  >
                    {i.orig}
                  </div>
                }
              >
                <p style={{ marginBottom: '0.5em', width: 'fit-content' }}>{i.trans}</p>
              </Tooltip>
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
        background: Colors.Background.Linear,
        padding: '6px 12px',
        borderRadius: 8,
        boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
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
      className={ClassName.Background.pseudoBlubBackground}
      dragHandleClassName="drag-handle"
    >
      <Content flex column fullWidth fullHeight gap={10}>
        {/* toolbar */}
        <Content
          flex
          gap={10}
          alignItems="center"
          justifyContent="space-between"
          className={classnames(ClassName.title(FontSize['16px']), 'drag-handle')}
          style={{
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            padding: '4px 0px',
            cursor: 'pointer',
            flexShrink: 0,
            overflowY: 'hidden'
          }}
        >
          <div>{t('translate.translate panel')}</div>
          <Content flex gap={6} alignItems="center">
            {!panelState.showHistory && (
              <>
                {!panelState.doubleRowLayout && (
                  <Button.IconButton
                    selected={panelState.showOrigin || undefined}
                    onClick={() => {
                      setPanelState(s => ({ ...s, showOrigin: !s.showOrigin }))
                    }}
                    icon="park-switch"
                    tooltip={t('translate.show original')}
                  />
                )}
                <Button.IconButton
                  selected={panelState.doubleRowLayout || undefined}
                  onClick={() => {
                    setPanelState(s => ({ ...s, doubleRowLayout: !s.doubleRowLayout }))
                  }}
                  icon="park-layout-two"
                  tooltip={t('translate.double row layout')}
                />
              </>
            )}

            <Button.IconButton
              selected={panelState.showHistory || undefined}
              icon="park-history"
              tooltip={t('translate.history')}
              onClick={() => {
                setPanelState(s => ({ ...s, showHistory: !s.showHistory }))
              }}
            />
            <Button.IconButton
              icon="park-close"
              tooltip={t('general.close')}
              onClick={() => {
                GlobalTranslateInstance.close?.()
              }}
            />
          </Content>
        </Content>
        {panelState.showHistory ? renderHistory() : renderPanel()}
      </Content>
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
    console.log(source)
    switch (type) {
      case 'pdf': {
        const pdf = await Actions.openPdf(objectId)
        if (source.page !== undefined) {
          pdf.jumpToPage?.(source.page)
          console.log(source.selectedText)
          source.selectedText && pdf.highlightText?.(source.selectedText, source.page)
        }
        break
      }
      case 'note': {
        const editor = await Actions.openEditor(objectId)
        if (source.blockId) {
          await goToBlock(source.blockId, editor)
          selectBlock(source.blockId, editor)
        }
        break
      }
      case 'webpage': {
        const webpage = await Actions.openWebpage(objectId)
        if (source.blockId) {
          const editor = await webpage.transformToNote()
          await goToBlock(source.blockId, editor)
          selectBlock(source.blockId, editor)
        }
        break
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
          icon: getIcon(meta.type, meta)
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
    <div>
      <IconNameItem
        onClick={handleNaivgate}
        className={css([
          {
            ':hover': {
              textDecoration: 'underline'
            }
          },
          small && ClassName.description(FontSize['13px'])
        ])}
        style={{ cursor: 'pointer' }}
        icon={sourceState?.icon}
        name={sourceState?.name}
      />
    </div>
  )
}
export default GlobalTranslateResult
